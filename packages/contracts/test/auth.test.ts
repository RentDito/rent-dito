import { describe, expect, it } from 'vitest';

import {
  appRoleSchema,
  loginRequestSchema,
  profileSchema,
  publicRegistrationRoleSchema,
  registerRequestSchema,
  sessionResponseSchema,
  usernameSchema,
} from '../src/index.js';

/**
 * Long enough to satisfy the policy, deliberately not passphrase-shaped.
 * Secret scanners flag realistic-looking literals, and a team that learns to
 * dismiss those warnings will eventually dismiss a real one.
 */
const VALID_TEST_PASSWORD = 'x'.repeat(16);

const validRegistration = {
  username: 'mateo_cruz',
  password: VALID_TEST_PASSWORD,
  displayName: 'Mateo Cruz',
  role: 'tenant' as const,
};

describe('role contract', () => {
  it('recognises exactly three application roles', () => {
    expect([...appRoleSchema.options].sort()).toEqual([
      'admin',
      'landlord',
      'tenant',
    ]);
  });

  it('never lets registration select the administrator role', () => {
    expect(publicRegistrationRoleSchema.safeParse('admin').success).toBe(false);
    expect(
      registerRequestSchema.safeParse({ ...validRegistration, role: 'admin' })
        .success,
    ).toBe(false);
  });
});

describe('username contract', () => {
  it('trims surrounding whitespace from the stored value', () => {
    expect(usernameSchema.parse('  mateo_cruz  ')).toBe('mateo_cruz');
  });

  it('measures length after trimming, not before', () => {
    expect(usernameSchema.safeParse('  a  ').success).toBe(false);
  });

  it.each([
    ['ab', 'shorter than three characters'],
    ['a'.repeat(31), 'longer than thirty characters'],
    ['mateo-cruz', 'containing a hyphen'],
    ['mateo cruz', 'containing a space'],
    ['mateo.cruz', 'containing a dot'],
  ])('rejects %s (%s)', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });

  it.each(['abc', 'a'.repeat(30), 'Mateo_Cruz_09'])('accepts %s', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(true);
  });
});

describe('registration contract', () => {
  it('accepts a minimal tenant registration without a phone number', () => {
    expect(registerRequestSchema.parse(validRegistration)).toMatchObject({
      username: 'mateo_cruz',
      role: 'tenant',
    });
  });

  it('requires a password of at least twelve characters', () => {
    expect(
      registerRequestSchema.safeParse({
        ...validRegistration,
        password: 'a'.repeat(11),
      }).success,
    ).toBe(false);
    expect(
      registerRequestSchema.safeParse({
        ...validRegistration,
        password: 'a'.repeat(12),
      }).success,
    ).toBe(true);
  });

  it('accepts an 11-digit Philippine mobile number', () => {
    expect(
      registerRequestSchema.safeParse({
        ...validRegistration,
        phone: '09171234567',
      }).success,
    ).toBe(true);
  });

  it.each(['+639171234567', '639171234567', '0917123456', '08171234567'])(
    'rejects phone %s',
    (phone) => {
      expect(
        registerRequestSchema.safeParse({ ...validRegistration, phone }).success,
      ).toBe(false);
    },
  );
});

describe('login contract', () => {
  it('does not enforce the password policy at the login boundary', () => {
    // Enforcing length here would leak the policy to someone without an
    // account, and every wrong password must fail identically regardless.
    expect(
      loginRequestSchema.safeParse({ username: 'mateo_cruz', password: 'x' })
        .success,
    ).toBe(true);
  });

  it('still requires a non-empty password', () => {
    expect(
      loginRequestSchema.safeParse({ username: 'mateo_cruz', password: '' })
        .success,
    ).toBe(false);
  });
});

describe('session contract', () => {
  const profile = {
    id: '3f6c1f2e-9a1b-4c7d-8e5f-2a1b3c4d5e6f',
    username: 'mateo_cruz',
    displayName: 'Mateo Cruz',
    phone: null,
    role: 'tenant' as const,
    status: 'active' as const,
  };

  it('describes a usable session', () => {
    expect(
      sessionResponseSchema.parse({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: 1_800_000_000,
        profile,
      }).profile.role,
    ).toBe('tenant');
  });

  it('rejects a profile whose id is not a uuid', () => {
    expect(profileSchema.safeParse({ ...profile, id: 'not-a-uuid' }).success).toBe(
      false,
    );
  });

  it('allows a null phone but not a missing one', () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
    const withoutPhone: Record<string, unknown> = { ...profile };
    delete withoutPhone.phone;
    expect(profileSchema.safeParse(withoutPhone).success).toBe(false);
  });
});
