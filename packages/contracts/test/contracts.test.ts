import { describe, expect, it } from 'vitest';

import {
  apiProblemSchema,
  featureKeySchema,
  featureResponseSchema,
} from '../src/index.js';

const allDisabled = () =>
  Object.fromEntries(featureKeySchema.options.map((key) => [key, false]));

describe('feature contract', () => {
  it('publishes exactly the nine planned MVP feature keys', () => {
    expect([...featureKeySchema.options].sort()).toEqual(
      [
        'accounts',
        'landlord_operations',
        'listing_authoring',
        'listing_moderation',
        'marketplace',
        'payment_proofs',
        'saved_inquiries',
        'tenancy_invitations',
        'tenant_billing',
      ].sort(),
    );
  });

  it('accepts a response that reports every key', () => {
    expect(featureResponseSchema.parse({ features: allDisabled() })).toEqual({
      features: allDisabled(),
    });
  });

  it('rejects a response that omits a key, so a new flag cannot ship unreported', () => {
    const features = allDisabled();
    delete (features as Record<string, unknown>).accounts;

    expect(featureResponseSchema.safeParse({ features }).success).toBe(false);
  });

  it('rejects a key that is not part of the published contract', () => {
    const features = { ...allDisabled(), speculative_feature: false };

    expect(featureResponseSchema.safeParse({ features }).success).toBe(false);
  });

  it('rejects a non-boolean flag value', () => {
    const features = { ...allDisabled(), marketplace: 'true' };

    expect(featureResponseSchema.safeParse({ features }).success).toBe(false);
  });
});

describe('api problem contract', () => {
  it('requires a code, message, and request id and leaves fields optional', () => {
    expect(
      apiProblemSchema.parse({ code: 'X', message: 'm', requestId: 'r' }),
    ).toEqual({ code: 'X', message: 'm', requestId: 'r' });
  });

  it('rejects a problem that cannot be correlated to a request', () => {
    expect(
      apiProblemSchema.safeParse({ code: 'X', message: 'm' }).success,
    ).toBe(false);
  });
});
