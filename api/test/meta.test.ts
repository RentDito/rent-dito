import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';

const ALLOWED_ORIGINS = ['https://rentdito.example'];

const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('platform metadata', () => {
  it('reports readiness when the database probe succeeds', async () => {
    const app = await buildApp({
      databaseProbe: async () => true,
      featureFlags: {},
      webOrigins: ALLOWED_ORIGINS,
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
      webOrigins: ALLOWED_ORIGINS,
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
      webOrigins: ALLOWED_ORIGINS,
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

describe('cross-origin access', () => {
  const buildCorsApp = async () =>
    buildApp({
      databaseProbe: async () => true,
      featureFlags: {},
      webOrigins: ALLOWED_ORIGINS,
    });

  it('allows a configured browser origin', async () => {
    const app = await buildCorsApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/meta/features',
      headers: { origin: 'https://rentdito.example' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://rentdito.example',
    );
  });

  it('does not grant access to an unconfigured origin', async () => {
    const app = await buildCorsApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/meta/features',
      headers: { origin: 'https://attacker.example' },
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
