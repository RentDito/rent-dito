import cors from '@fastify/cors';
import Fastify from 'fastify';

import {
  registerMetaRoutes,
  type FeatureFlags,
  type MetaDependencies,
} from './modules/meta/routes.js';

export interface AppDependencies extends MetaDependencies {
  featureFlags: Partial<FeatureFlags>;
  /**
   * Exact browser origins allowed to call this API. Validated in `env.ts`, so
   * an empty list here means a deployment forgot to configure `WEB_ORIGINS`
   * rather than "allow everything".
   */
  webOrigins: string[];
}

export async function buildApp(dependencies: AppDependencies) {
  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization'],
    },
  });

  // Reflect only configured origins. `origin: true` would echo whatever the
  // caller sent, which combined with credentials is the classic CORS hole.
  await app.register(cors, {
    origin: dependencies.webOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  });

  await registerMetaRoutes(app, dependencies);

  return app;
}
