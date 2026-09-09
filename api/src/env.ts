import { z } from 'zod';

import type { FeatureFlags } from './modules/meta/routes.js';

const booleanStringSchema = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const originSchema = z
  .url()
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.pathname === '/' && url.search === '' && url.hash === '';
  }, 'Must be an origin without a path, query, or fragment')
  .transform((value) => new URL(value).origin);

const rawEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WEB_ORIGINS: z
    .string()
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(originSchema).min(1)),
  FEATURE_ACCOUNTS: booleanStringSchema,
  FEATURE_MARKETPLACE: booleanStringSchema,
  FEATURE_LISTING_AUTHORING: booleanStringSchema,
  FEATURE_LISTING_MODERATION: booleanStringSchema,
  FEATURE_SAVED_INQUIRIES: booleanStringSchema,
  FEATURE_TENANCY_INVITATIONS: booleanStringSchema,
  FEATURE_TENANT_BILLING: booleanStringSchema,
  FEATURE_PAYMENT_PROOFS: booleanStringSchema,
  FEATURE_LANDLORD_OPERATIONS: booleanStringSchema,
});

export interface ServerEnvironment {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  webOrigins: string[];
  featureFlags: FeatureFlags;
}

export function loadEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): ServerEnvironment {
  const parsed = rawEnvironmentSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid server environment: ${details}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    webOrigins: parsed.data.WEB_ORIGINS,
    featureFlags: {
      accounts: parsed.data.FEATURE_ACCOUNTS,
      marketplace: parsed.data.FEATURE_MARKETPLACE,
      listing_authoring: parsed.data.FEATURE_LISTING_AUTHORING,
      listing_moderation: parsed.data.FEATURE_LISTING_MODERATION,
      saved_inquiries: parsed.data.FEATURE_SAVED_INQUIRIES,
      tenancy_invitations: parsed.data.FEATURE_TENANCY_INVITATIONS,
      tenant_billing: parsed.data.FEATURE_TENANT_BILLING,
      payment_proofs: parsed.data.FEATURE_PAYMENT_PROOFS,
      landlord_operations: parsed.data.FEATURE_LANDLORD_OPERATIONS,
    },
  };
}
