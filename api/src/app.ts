import Fastify from 'fastify';

import {
  registerMetaRoutes,
  type FeatureFlags,
  type MetaDependencies,
} from './modules/meta/routes.js';

export interface AppDependencies extends MetaDependencies {
  featureFlags: Partial<FeatureFlags>;
}

export async function buildApp(dependencies: AppDependencies) {
  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization'],
    },
  });

  await registerMetaRoutes(app, dependencies);

  return app;
}
