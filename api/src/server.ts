import { createClient } from '@supabase/supabase-js';

import { buildApp } from './app.js';
import { loadEnvironment } from './env.js';

const environment = loadEnvironment();
const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);

const app = await buildApp({
  featureFlags: environment.featureFlags,
  webOrigins: environment.webOrigins,
  databaseProbe: async () => {
    try {
      const { error } = await supabase
        .from('audit_events')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      return error === null;
    } catch {
      return false;
    }
  },
});

const close = async () => {
  await app.close();
};

process.once('SIGINT', close);
process.once('SIGTERM', close);

try {
  await app.listen({
    host: '0.0.0.0',
    port: environment.port,
  });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
