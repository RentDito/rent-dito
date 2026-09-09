import { describe, expect, it } from 'vitest';

import { loadEnvironment } from '../src/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '4000',
  SUPABASE_URL: 'https://rentdito-test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  WEB_ORIGINS: 'https://rentdito.vercel.app,http://localhost:5173',
};

describe('server environment', () => {
  it('parses deployment configuration and defaults every feature to disabled', () => {
    const environment = loadEnvironment(validEnvironment);

    expect(environment).toMatchObject({
      nodeEnv: 'test',
      port: 4000,
      supabaseUrl: 'https://rentdito-test.supabase.co',
      webOrigins: ['https://rentdito.vercel.app', 'http://localhost:5173'],
    });
    expect(Object.values(environment.featureFlags)).toEqual(Array(9).fill(false));
  });

  it('enables only flags explicitly set to true', () => {
    const environment = loadEnvironment({
      ...validEnvironment,
      FEATURE_MARKETPLACE: 'true',
      FEATURE_ACCOUNTS: 'false',
    });

    expect(environment.featureFlags.marketplace).toBe(true);
    expect(environment.featureFlags.accounts).toBe(false);
  });

  it('rejects invalid URLs, ports, origins, and feature values', () => {
    expect(() =>
      loadEnvironment({
        ...validEnvironment,
        PORT: '70000',
        SUPABASE_URL: 'not-a-url',
        WEB_ORIGINS: 'https://valid.example,not-an-origin',
        FEATURE_ACCOUNTS: 'yes',
      }),
    ).toThrow('Invalid server environment');
  });
});
