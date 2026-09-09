import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';

describe('platform metadata', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('reports readiness when the database probe succeeds', async () => {
    const app = await buildApp({
      databaseProbe: async () => true,
      featureFlags: {},
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'ok' });
  });

  it('reports dependency failure when the database probe fails', async () => {
    const app = await buildApp({
      databaseProbe: async () => false,
      featureFlags: {},
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: 'unavailable',
      database: 'unavailable',
    });
  });

  it('returns every feature disabled unless explicitly enabled', async () => {
    const app = await buildApp({
      databaseProbe: async () => true,
      featureFlags: { marketplace: true },
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/v1/meta/features' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      features: {
        accounts: false,
        marketplace: true,
        listing_authoring: false,
        listing_moderation: false,
        saved_inquiries: false,
        tenancy_invitations: false,
        tenant_billing: false,
        payment_proofs: false,
        landlord_operations: false,
      },
    });
  });
});
