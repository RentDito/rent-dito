import type { FastifyInstance } from 'fastify';
import { featureResponseSchema, type FeatureKey } from '@rentdito/contracts';

export type FeatureFlags = Record<FeatureKey, boolean>;

const featureKeys = [
  'accounts',
  'marketplace',
  'listing_authoring',
  'listing_moderation',
  'saved_inquiries',
  'tenancy_invitations',
  'tenant_billing',
  'payment_proofs',
  'landlord_operations',
] as const satisfies readonly FeatureKey[];

export interface MetaDependencies {
  databaseProbe: () => Promise<boolean>;
  featureFlags: Partial<FeatureFlags>;
}

export async function registerMetaRoutes(
  app: FastifyInstance,
  dependencies: MetaDependencies,
) {
  app.get('/healthz', async (_request, reply) => {
    const ready = await dependencies.databaseProbe();

    if (!ready) {
      return reply.code(503).send({
        status: 'unavailable',
        database: 'unavailable',
      });
    }

    return { status: 'ok', database: 'ok' };
  });

  // Parsing on the way out keeps the published contract the single source of
  // truth: a key added to `featureKeySchema` but missed here fails loudly.
  app.get('/v1/meta/features', async () =>
    featureResponseSchema.parse({
      features: Object.fromEntries(
        featureKeys.map((key) => [key, dependencies.featureFlags[key] ?? false]),
      ),
    }),
  );
}
