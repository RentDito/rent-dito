# RentDito Production MVP Feature Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the RentDito frontend prototype's local demo behavior with a secure, durable production MVP that can be released one complete feature slice at a time.

**Architecture:** Keep the existing React feature architecture and introduce an HTTP repository backed by a modular TypeScript/Fastify API on Render. The API validates Supabase Auth sessions and owns business transitions, while Supabase Postgres, Row Level Security, and private Storage hold authoritative data; shared Zod contracts keep frontend and API payloads aligned.

**Tech Stack:** Node.js 24.x, npm workspaces, React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Fastify, Supabase Auth/Postgres/Storage/CLI, Vitest, Testing Library, pgTAP, Playwright, Vercel, Render

**Spec:** `docs/superpowers/specs/2026-09-09-rentdito-mvp-production-architecture-design.md`

## Global Constraints

- Production hosting is Vercel for the frontend, Render for the TypeScript API and scheduled due job, and Supabase for Auth, Postgres, and private Storage.
- Public registration creates a permanently fixed `tenant` or `landlord` role; `admin` accounts are privately provisioned.
- Login uses a globally unique, case-insensitive username and password. Email and SMS login, notifications, and self-service recovery are outside the MVP.
- Listings require administrator approval before publication.
- Tenancy invitations use high-entropy, expiring, revocable, single-use codes that landlords share outside RentDito.
- A tenant receipt submission never changes a balance. Only landlord approval creates the payment and settles the due.
- The application does not process money, collect financial credentials, or interpret receipts automatically.
- Listing photos and payment receipts remain in separate private Storage buckets and are exposed through short-lived authorized URLs.
- Database changes are backward-compatible and deploy before the API and frontend that consume them.
- Production must not expose demo role switching, mock persistence, simulated-payment behavior, or reset-demo controls.
- Every exposed application table and Storage object path is protected by explicit grants and Row Level Security.
- Node is pinned to `24.x` with an upper bound so Vercel and Render use the same major version.

---

## Target File Structure

```text
/
├── package.json                         # npm workspace commands and Node pin
├── package-lock.json                    # one lockfile for every workspace
├── .node-version                       # exact Node 24 release used by CI/Render
├── render.yaml                          # API and due-generation cron
├── .github/workflows/ci.yml             # database, API, frontend, and E2E gates
├── packages/contracts/
│   └── src/
│       ├── common.ts                    # IDs, pagination, API errors, feature keys
│       ├── auth.ts                      # registration/session/profile schemas
│       ├── listings.ts                  # public and landlord listing contracts
│       ├── moderation.ts                # review queue and decision contracts
│       ├── inquiries.ts                 # saves, threads, and messages
│       ├── tenancies.ts                 # invitation and tenancy contracts
│       ├── billing.ts                   # dues, payments, and proof contracts
│       └── index.ts                     # public package exports
├── api/
│   └── src/
│       ├── app.ts                       # Fastify composition without listening
│       ├── server.ts                    # Render process entry point
│       ├── env.ts                       # parsed server environment
│       ├── plugins/
│       │   ├── auth.ts                  # token verification and request actor
│       │   ├── errors.ts                # stable API problem responses
│       │   └── supabase.ts              # admin, anonymous, and user clients
│       ├── modules/                      # meta, auth, listings, moderation, inquiries,
│       │                                 # invitations, billing, proofs, and operations
│       └── jobs/
│           ├── generateDues.ts
│           └── cleanupUploads.ts
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/                      # one ordered migration per feature slice
│   └── tests/database/                  # pgTAP schema, RLS, and RPC tests
└── frontend/
    ├── vercel.json                       # SPA rewrite and security headers
    └── src/
        ├── app/auth/                     # production session provider and guards
        ├── app/repositories.ts           # HTTP adapter composition
        ├── shared/api/http/              # fetch client and API repository modules
        ├── features/                     # existing and new feature use cases
        └── pages/admin/                  # internal moderation workspace
```

Dependencies point inward: `frontend -> contracts`, `api -> contracts`, and neither workspace imports the other. Database-generated types stay inside `api/src/generated/database.types.ts`; public request and response types live only in `@rentdito/contracts`.

---

### Task 0: Establish the Deployable Platform Foundation

**Feature release:** Delivery foundation; no production product behavior is enabled.

**Implementation handoff:** `docs/task-0-foundation-implementation.md`

**Files:**
- Create: `package.json`
- Create: `package-lock.json` through npm
- Create: `.node-version`
- Modify: `.gitignore`
- Modify: `frontend/package.json`
- Remove after root lockfile generation: `frontend/package-lock.json`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/common.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `api/package.json`
- Create: `api/tsconfig.json`
- Create: `api/eslint.config.js`
- Create: `api/vitest.config.ts`
- Create: `api/src/env.ts`
- Create: `api/src/app.ts`
- Create: `api/src/server.ts`
- Create through Supabase CLI: `api/src/generated/database.types.ts`
- Create: `api/src/plugins/idempotency.ts`
- Create: `api/src/modules/meta/routes.ts`
- Create: `api/test/meta.test.ts`
- Create: `supabase/config.toml`
- Create: `supabase/seed.sql`
- Create: `supabase/migrations/202609090001_foundation.sql`
- Create: `supabase/tests/database/001_foundation.test.sql`
- Create: `frontend/vercel.json`
- Create: `render.yaml`
- Create: `.github/workflows/ci.yml`
- Create: `.env.example`
- Create: `frontend/.env.example`
- Create: `api/.env.example`

**Interfaces:**
- Produces: `GET /healthz -> { status: 'ok'; database: 'ok' }`
- Produces: `GET /v1/meta/features -> { features: Record<FeatureKey, boolean> }`
- Produces: `ApiProblem { code: string; message: string; requestId: string; fields?: Record<string, string> }`
- Consumes: no earlier feature interfaces

- [ ] **Step 1: Create the root workspace and pin Node**

```json
{
  "name": "rentdito",
  "private": true,
  "engines": { "node": ">=24.0.0 <25" },
  "workspaces": ["frontend", "api", "packages/contracts"],
  "scripts": {
    "build": "npm run build -w @rentdito/contracts && npm run build -w @rentdito/api && npm run build -w @rentdito/frontend",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test:run --workspaces --if-present",
    "db:start": "supabase start",
    "db:reset": "supabase db reset --local",
    "db:test": "supabase test db --local",
    "db:lint": "supabase db lint --local --level error",
    "e2e": "npm run e2e -w @rentdito/frontend"
  },
  "devDependencies": {
    "supabase": "^2.117.0"
  }
}
```

Use these workspace package shapes, then let `npm install` write resolved dependency versions into the root lockfile:

`packages/contracts/package.json`:

```json
{
  "name": "@rentdito/contracts",
  "private": true,
  "type": "module",
  "exports": { ".": "./dist/index.js" },
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": { "zod": "^4.1.5" },
  "devDependencies": { "typescript": "^5.9.2" }
}
```

`api/package.json`:

```json
{
  "name": "@rentdito/api",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24.0.0 <25" },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "test:run": "vitest run",
    "job:generate-dues": "node dist/jobs/generateDues.js",
    "job:cleanup-uploads": "node dist/jobs/cleanupUploads.js",
    "admin:create": "node dist/commands/adminAccounts.js create",
    "admin:reset-password": "node dist/commands/adminAccounts.js reset-password"
  },
  "dependencies": {
    "@fastify/cors": "^11.3.0",
    "@fastify/helmet": "^13.1.1",
    "@fastify/rate-limit": "^11.2.0",
    "@rentdito/contracts": "*",
    "@supabase/supabase-js": "^2.116.0",
    "fastify": "^5.12.3",
    "file-type": "^22.0.2",
    "zod": "^4.1.5"
  },
  "devDependencies": {
    "@types/node": "^24.3.0",
    "eslint": "^9.34.0",
    "globals": "^16.3.0",
    "tsx": "^4.23.13",
    "typescript": "^5.9.2",
    "typescript-eslint": "^8.41.0",
    "vitest": "^3.2.4"
  }
}
```

Use explicit Node ESM compiler configurations so the shared contract emits declarations and the API emits runnable JavaScript:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

Use that file for `packages/contracts/tsconfig.json`. Use the following for `api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["test", "dist"]
}
```

`api/eslint.config.js` uses Node globals and the existing TypeScript rule baseline:

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
);
```

These versions were current on 2026-09-09; commit the root lockfile so every environment resolves the same dependency graph. Share the existing ESLint configuration rules with the API or add a focused API flat config using Node globals.

Set `.node-version` to `24.14.1`, matching `render.yaml`, and select Node 24.x in Vercel. Rename the frontend package to `@rentdito/frontend`, add `@rentdito/contracts: "*"`, and create `@rentdito/api` and `@rentdito/contracts` workspaces. Add root `node_modules/`, `api/dist/`, and Supabase CLI temp directories to `.gitignore`. Run `npm install` at the repository root to create one lockfile; delete the now-redundant frontend lockfile only after the root lockfile includes the frontend dependencies.

- [ ] **Step 2: Write the failing platform contract test**

```ts
// api/test/meta.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('platform metadata', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];
  afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

  it('reports readiness and disabled feature defaults', async () => {
    const app = await buildApp({
      databaseProbe: async () => true,
      featureFlags: { accounts: false, marketplace: false },
    });
    apps.push(app);

    const health = await app.inject({ method: 'GET', url: '/healthz' });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: 'ok', database: 'ok' });

    const features = await app.inject({ method: 'GET', url: '/v1/meta/features' });
    expect(features.statusCode).toBe(200);
    expect(features.json().features.accounts).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test and confirm the red state**

Run: `npm run test:run -w @rentdito/api -- test/meta.test.ts`

Expected: FAIL because `buildApp` and the meta routes do not exist.

- [ ] **Step 4: Define shared platform contracts**

```ts
// packages/contracts/src/common.ts
import { z } from 'zod';

export const featureKeySchema = z.enum([
  'accounts',
  'marketplace',
  'listing_authoring',
  'listing_moderation',
  'saved_inquiries',
  'tenancy_invitations',
  'tenant_billing',
  'payment_proofs',
  'landlord_operations',
]);
export type FeatureKey = z.infer<typeof featureKeySchema>;

export const apiProblemSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});
export type ApiProblem = z.infer<typeof apiProblemSchema>;

export const featureResponseSchema = z.object({
  features: z.record(featureKeySchema, z.boolean()),
});
```

Export these values from `packages/contracts/src/index.ts`. Configure both consumers to resolve `@rentdito/contracts` through workspace package exports.

- [ ] **Step 5: Create the foundation migration and database test**

```sql
-- supabase/migrations/202609090001_foundation.sql
create extension if not exists pgcrypto with schema extensions;

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;

create table public.idempotency_records (
  actor_id uuid not null references auth.users(id) on delete cascade,
  key uuid not null,
  operation text not null,
  request_hash text not null,
  response_status smallint,
  response_body jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_id, key)
);

create table public.upload_intents (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null references storage.buckets(id),
  storage_path text not null unique,
  expected_mime_type text not null,
  expected_byte_size integer not null check (expected_byte_size > 0),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  cleaned_at timestamptz
);

alter table public.idempotency_records enable row level security;
alter table public.upload_intents enable row level security;
revoke all on public.idempotency_records, public.upload_intents from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-media', 'listing-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

```sql
-- supabase/tests/database/001_foundation.test.sql
begin;
select plan(6);
select has_table('public', 'audit_events', 'audit table exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  true,
  'audit events use RLS'
);
select has_table('public', 'idempotency_records', 'idempotency records exist');
select has_table('public', 'upload_intents', 'upload intents exist');
select results_eq(
  $$ select public from storage.buckets where id = 'listing-media' $$,
  array[false],
  'listing media is private'
);
select results_eq(
  $$ select file_size_limit from storage.buckets where id = 'payment-proofs' $$,
  array[5242880::bigint],
  'payment proof size is limited to 5 MiB'
);
select * from finish();
rollback;
```

After `npm run db:reset`, generate the initial typed database contract:

```bash
npx supabase gen types --lang=typescript --local > api/src/generated/database.types.ts
```

Repeat this command in every schema-changing task and commit the changed generated file with that slice.

- [ ] **Step 6: Implement the health and feature endpoints**

```ts
// api/src/app.ts
import Fastify from 'fastify';
import { registerMetaRoutes, type FeatureFlags } from './modules/meta/routes.js';

export interface AppDependencies {
  databaseProbe: () => Promise<boolean>;
  featureFlags: Partial<FeatureFlags>;
}

export async function buildApp(deps: AppDependencies) {
  const app = Fastify({ logger: { redact: ['req.headers.authorization'] } });
  await registerMetaRoutes(app, deps);
  return app;
}
```

```ts
// api/src/modules/meta/routes.ts
import type { FastifyInstance } from 'fastify';
import type { FeatureKey } from '@rentdito/contracts';

export type FeatureFlags = Record<FeatureKey, boolean>;
const keys: FeatureKey[] = [
  'accounts', 'marketplace', 'listing_authoring', 'listing_moderation',
  'saved_inquiries', 'tenancy_invitations', 'tenant_billing',
  'payment_proofs', 'landlord_operations',
];

export async function registerMetaRoutes(
  app: FastifyInstance,
  deps: { databaseProbe: () => Promise<boolean>; featureFlags: Partial<FeatureFlags> },
) {
  app.get('/healthz', async (_request, reply) => {
    const ready = await deps.databaseProbe();
    return ready
      ? { status: 'ok' as const, database: 'ok' as const }
      : reply.code(503).send({ status: 'unavailable', database: 'unavailable' });
  });
  app.get('/v1/meta/features', async () => ({
    features: Object.fromEntries(keys.map((key) => [key, deps.featureFlags[key] ?? false])),
  }));
}
```

Parse all environment variables with Zod in `env.ts`; reject startup when `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WEB_ORIGINS`, or `PORT` is invalid. `server.ts` calls `buildApp` and listens on `0.0.0.0`.

`idempotency.ts` exposes `runIdempotent<T>(actorId, key, operation, requestHash, work): Promise<T>`. It inserts a pending record, runs `work` once, stores the successful status/body, and returns that body on a matching retry. Reusing a key with another operation or request hash returns `409 IDEMPOTENCY_KEY_REUSED`. Records older than 24 hours may be removed by the cleanup job.

- [ ] **Step 7: Add deployment and CI configuration**

`frontend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

`render.yaml`:

```yaml
services:
  - type: web
    name: rentdito-api
    runtime: node
    rootDir: .
    buildCommand: npm ci && npm run build -w @rentdito/contracts && npm run build -w @rentdito/api
    startCommand: npm run start -w @rentdito/api
    healthCheckPath: /healthz
    envVars:
      - key: NODE_VERSION
        value: 24.14.1
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: WEB_ORIGINS
        sync: false
```

CI runs `npm ci`, `npx supabase start`, `npm run db:reset`, `npm run db:lint`, `npm run db:test`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npm run e2e`. Use GitHub environment secrets only for an explicit deployment workflow; pull-request checks use local Supabase.

- [ ] **Step 8: Run the complete foundation gate**

Run:

```bash
npm ci
npx supabase start
npm run db:reset
npm run db:lint
npm run db:test
npm run typecheck
npm run lint
npm run test
npm run build
```

Expected: every command exits 0; the database tests report six passing assertions; `GET /healthz` returns 200 with a running local Supabase instance.

- [ ] **Step 9: Deploy the disabled foundation and smoke-test it**

Create separate staging and production Supabase projects. Configure a staging Render service from `render.yaml`, configure the Vercel project with root directory `frontend`, and set `VITE_API_BASE_URL` to the staging API for preview builds. Keep every feature flag false.

Set a task-specific `RENDITO_STAGING_API_URL` shell variable to the exact URL displayed by Render, then verify:

```bash
curl "$RENDITO_STAGING_API_URL/healthz"
curl "$RENDITO_STAGING_API_URL/v1/meta/features"
```

Expected: health is 200 and every feature is false. Do not commit the task-specific deployment URL or secrets.

- [ ] **Step 10: Commit the foundation**

```bash
git add .github .gitignore .node-version package.json package-lock.json render.yaml api packages supabase frontend/package.json frontend/vercel.json .env.example frontend/.env.example api/.env.example
git commit -m "build: establish production platform foundation"
```

---

### Task 1: Ship Username/Password Accounts and Fixed Roles

**Feature release:** Accounts and authorization.

**Files:**
- Create: `packages/contracts/src/auth.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609090002_accounts.sql`
- Create: `supabase/tests/database/002_accounts_rls.test.sql`
- Create: `api/src/plugins/supabase.ts`
- Create: `api/src/plugins/auth.ts`
- Create: `api/src/plugins/errors.ts`
- Create: `api/src/modules/auth/routes.ts`
- Create: `api/src/modules/auth/service.ts`
- Create: `api/src/commands/adminAccounts.ts`
- Create: `api/test/auth.test.ts`
- Create: `api/test/admin-accounts.test.ts`
- Create: `frontend/src/app/auth/AuthProvider.tsx`
- Create: `frontend/src/app/auth/authContext.ts`
- Create: `frontend/src/app/auth/RequireRole.tsx`
- Create: `frontend/src/shared/api/http/apiClient.ts`
- Create: `frontend/src/shared/api/supabaseBrowser.ts`
- Modify: `frontend/src/pages/auth/SignInPage.tsx`
- Modify: `frontend/src/pages/auth/RegisterPage.tsx`
- Modify: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/app/App.tsx`
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/app/layouts/PublicLayout.tsx`
- Modify: `frontend/src/app/layouts/WorkspaceLayout.tsx`
- Create: `frontend/src/pages/auth/auth.test.tsx`
- Create: `frontend/e2e/auth.spec.ts`

**Interfaces:**
- Produces: `POST /v1/auth/register`
- Produces: `POST /v1/auth/login`
- Produces: `POST /v1/auth/logout`
- Produces: `GET /v1/auth/me`
- Produces: `SessionResponse { accessToken; refreshToken; expiresAt; profile }`
- Produces: `RequestActor { userId; role; username }` on protected API requests
- Consumes: Task 0 API problem and feature contracts

- [x] **Step 1: Define the shared account contract**

```ts
// packages/contracts/src/auth.ts
import { z } from 'zod';

export const appRoleSchema = z.enum(['tenant', 'landlord', 'admin']);
export const publicRegistrationRoleSchema = z.enum(['tenant', 'landlord']);
export const usernameSchema = z.string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores only.');
export const passwordSchema = z.string().min(12).max(128);

export const registerRequestSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^09\d{9}$/, 'Use an 11-digit Philippine mobile number.').optional(),
  role: publicRegistrationRoleSchema,
});
export const loginRequestSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1).max(128),
});
export const profileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string(),
  phone: z.string().nullable(),
  role: appRoleSchema,
  status: z.enum(['active', 'disabled']),
});
export const sessionResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number().int(),
  profile: profileSchema,
});
export type AppRole = z.infer<typeof appRoleSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
```

- [ ] **Step 2: Write failing API and database authorization tests**

```ts
// api/test/auth.test.ts
it('registers a fixed-role account and returns a usable session', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/register',
    payload: {
      username: 'mateo_cruz',
      password: 'correct-horse-rentdito',
      displayName: 'Mateo Cruz',
      role: 'tenant',
    },
  });
  expect(response.statusCode).toBe(201);
  expect(response.json().profile).toMatchObject({
    username: 'mateo_cruz',
    role: 'tenant',
  });
  expect(response.json().accessToken).toEqual(expect.any(String));
});

it('does not reveal whether a username exists', async () => {
  const missing = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { username: 'missing_user', password: 'wrong-password' },
  });
  expect(missing.statusCode).toBe(401);
  expect(missing.json().code).toBe('INVALID_CREDENTIALS');
  expect(missing.json().message).toBe('The username or password is incorrect.');
});
```

```sql
-- core assertion in 002_accounts_rls.test.sql
select throws_ok(
  $$ update public.profiles set role = 'landlord' where id = auth.uid() $$,
  '42501',
  null,
  'a tenant cannot change their fixed role'
);
```

- [ ] **Step 3: Run the tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/auth.test.ts
npm run db:test
```

Expected: API tests fail because routes do not exist; the database test fails because account tables and policies do not exist.

- [ ] **Step 4: Create account tables, immutable-role enforcement, and RLS**

```sql
create type public.app_role as enum ('tenant', 'landlord', 'admin');
create type public.account_status as enum ('active', 'disabled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role public.app_role not null,
  status public.account_status not null default 'active',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.auth_aliases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  normalized_username citext not null unique,
  auth_identifier text not null unique
);

alter table public.profiles enable row level security;
alter table public.auth_aliases enable row level security;
revoke all on public.auth_aliases from anon, authenticated;
grant select, update (display_name, phone) on public.profiles to authenticated;

create policy "profiles read self"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles update safe self fields"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.prevent_profile_identity_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.username <> old.username or new.role <> old.role then
    raise exception 'profile identity fields are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
```

Enable `citext`, attach `set_updated_at`, attach the immutable identity trigger, and revoke direct inserts/deletes. Add a trigger on `auth.users` that reads validated server-supplied metadata to create the profile and auth alias. The public registration endpoint must reject `admin` before calling the Auth admin API.

- [ ] **Step 5: Implement secure account orchestration**

```ts
// api/src/modules/auth/service.ts
export const normalizeUsername = (value: string) => value.trim().toLocaleLowerCase('en-US');

export interface AuthDependencies {
  admin: SupabaseClient<Database>;
  createAnonymousClient: () => SupabaseClient<Database>;
}

const invalidCredentials = () => new ApiError(
  401,
  'INVALID_CREDENTIALS',
  'The username or password is incorrect.',
);

async function loadProfile(admin: SupabaseClient<Database>, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, username, display_name, phone, role, status')
    .eq('id', userId)
    .single();
  if (error) throw invalidCredentials();
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    phone: data.phone,
    role: data.role,
    status: data.status,
  };
}

export async function login(
  input: LoginRequest,
  deps: Pick<AuthDependencies, 'admin' | 'createAnonymousClient'>,
): Promise<SessionResponse> {
  const normalized = normalizeUsername(input.username);
  const { data: alias } = await deps.admin
    .from('auth_aliases')
    .select('auth_identifier')
    .eq('normalized_username', normalized)
    .maybeSingle();
  if (!alias) throw invalidCredentials();

  const client = deps.createAnonymousClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: alias.auth_identifier,
    password: input.password,
  });
  if (error || !data.session) throw invalidCredentials();
  const profile = await loadProfile(deps.admin, data.user.id);
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? 0,
    profile: profileSchema.parse(profile),
  };
}
```

Registration generates an unguessable internal address under the application's owned auth subdomain, calls `auth.admin.createUser` with `email_confirm: true`, and passes `username`, `display_name`, and the allowed role as metadata. If profile creation fails, delete the just-created Auth user. Add Fastify rate limiting to registration and login. Redact authorization headers, passwords, refresh tokens, and response session fields from logs.

`auth.ts` decorates protected requests with `RequestActor` after Supabase validates the access token and the API loads the active profile. `requireRole('tenant')` and `requireRole('landlord', 'admin')` return `403 ROLE_FORBIDDEN` without disclosing target records.

`adminAccounts.ts` provides server-only `create` and `reset-password` subcommands. Both require the service-role environment, reject non-interactive missing arguments, write an audit event, and print the affected username but never the password. Add `admin:create` and `admin:reset-password` npm scripts; no HTTP route exposes either operation.

- [ ] **Step 6: Replace demo sessions with the production Auth provider**

```tsx
// frontend/src/app/auth/RequireRole.tsx
export function RequireRole({ allow, children }: {
  allow: AppRole[];
  children: ReactNode;
}) {
  const { status, profile } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Skeleton lines={3} />;
  if (!profile) {
    return <Navigate replace to={routes.signIn} state={{ returnTo: location }} />;
  }
  if (!allow.includes(profile.role)) return <Navigate replace to={roleHome(profile.role)} />;
  return children;
}
```

Add `@supabase/supabase-js: "^2.116.0"` to the frontend workspace. Update sign-in and registration copy to remove every prototype disclaimer and replace email with username while retaining optional Philippine mobile contact information. Registration offers only tenant and landlord. On success, store the Supabase session through `supabaseBrowser.ts`, configured with `VITE_SUPABASE_URL` and the publishable key; keep profile state in `AuthProvider`, clear the Query cache on logout, and navigate to the fixed role's home. Remove production use of `DemoSessionProvider`; retain test helpers only under `src/test`.

- [ ] **Step 7: Add frontend and browser account tests**

```tsx
it('returns an unauthenticated tenant to the requested listing after login', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/listings/property-1', auth: null });
  await user.click(await screen.findByRole('button', { name: 'Inquire about this property' }));
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await user.type(screen.getByLabelText('Username'), 'mateo_cruz');
  await user.type(screen.getByLabelText('Password'), 'correct-horse-rentdito');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('heading', { name: /property details/i })).toBeVisible();
});
```

Playwright creates unique tenant and landlord usernames through the API, signs in through the UI, reloads, verifies session restoration, verifies role-specific navigation, and verifies that a tenant receives 403 from a landlord endpoint.

- [ ] **Step 8: Run the account feature gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/auth.test.ts test/admin-accounts.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/auth/auth.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/auth.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: every command exits 0; negative role and role-mutation tests pass.

- [ ] **Step 9: Release accounts**

Deploy migration `202609090002_accounts.sql`, deploy the API, deploy the frontend with `accounts=false`, provision one staging admin through a documented server-only command, run the auth smoke journey, then set `accounts=true`. Confirm demo-role controls remain absent.

- [ ] **Step 10: Commit accounts**

```bash
git add packages/contracts api/src/plugins api/src/modules/auth api/test/auth.test.ts supabase frontend/src/app frontend/src/pages/auth frontend/src/pages/SettingsPage.tsx frontend/e2e/auth.spec.ts
git commit -m "feat: add fixed-role username accounts"
```

---

### Task 2: Ship the Supabase-Backed Public Marketplace

**Feature release:** Public listing discovery and detail.

**Files:**
- Create: `packages/contracts/src/listings.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609090003_public_listings.sql`
- Modify: `supabase/seed.sql`
- Create: `supabase/tests/database/003_public_listings_rls.test.sql`
- Create: `api/src/modules/listings/routes.ts`
- Create: `api/src/modules/listings/service.ts`
- Create: `api/src/modules/listings/repository.ts`
- Create: `api/test/listings.test.ts`
- Create: `frontend/src/shared/api/http/HttpRentDitoRepository.ts`
- Modify: `frontend/src/shared/api/contracts.ts`
- Modify: `frontend/src/app/repositories.ts`
- Modify: `frontend/src/entities/property/model.ts`
- Modify: `frontend/src/features/listing-search/useListingSearch.ts`
- Modify: `frontend/src/pages/marketplace/HomePage.tsx`
- Modify: `frontend/src/pages/marketplace/ListingDetailPage.tsx`
- Modify: `frontend/src/pages/marketplace/marketplace.test.tsx`
- Modify: `frontend/e2e/marketplace.spec.ts`

**Interfaces:**
- Produces: `GET /v1/listings?q&city&type&minRent&maxRent -> ListingPage`
- Produces: `GET /v1/listings/:propertyId -> PublicProperty | 404`
- Produces: `ListingPage { items: ListingSummary[]; total: number }`
- Consumes: Task 0 API errors and Task 1 optional actor

- [ ] **Step 1: Define listing schemas without leaking owner-private fields**

```ts
export const propertyTypeSchema = z.enum(['apartment', 'condominium', 'house', 'bedspace']);
export const unitStatusSchema = z.enum(['available', 'occupied', 'reserved', 'maintenance']);
export const listingFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  type: propertyTypeSchema.optional(),
  minRent: z.coerce.number().positive().optional(),
  maxRent: z.coerce.number().positive().optional(),
}).refine((value) => !value.minRent || !value.maxRent || value.minRent <= value.maxRent, {
  message: 'Minimum rent must not exceed maximum rent.',
  path: ['minRent'],
});

export const publicUnitSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  floorAreaSqm: z.number().positive(),
  monthlyRent: z.number().nonnegative(),
  deposit: z.number().nonnegative(),
  status: unitStatusSchema,
});
```

`PublicProperty` includes title, type, description, public address fields, amenities, house rules, availability, `listingReviewed: true`, available/public unit facts, and signed media URLs with expiration. It does not expose auth identifiers, unpublished properties, review notes, private Storage paths, or landlord private profile fields.

- [ ] **Step 2: Write failing public visibility tests**

```ts
it('returns only published properties with available units', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/listings?city=Makati' });
  expect(response.statusCode).toBe(200);
  expect(response.json().items).toHaveLength(1);
  expect(response.json().items[0]).toMatchObject({
    city: 'Makati',
    moderationStatus: 'published',
  });
  expect(response.json().items[0]).not.toHaveProperty('storagePath');
});

it('does not reveal a draft by identifier', async () => {
  const response = await app.inject({ method: 'GET', url: `/v1/listings/${draftId}` });
  expect(response.statusCode).toBe(404);
  expect(response.json().code).toBe('LISTING_NOT_FOUND');
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run: `npm run test:run -w @rentdito/api -- test/listings.test.ts`

Expected: FAIL because the listing tables and endpoints do not exist.

- [ ] **Step 4: Create property, unit, and media tables with public-read policies**

```sql
create type public.property_type as enum ('apartment', 'condominium', 'house', 'bedspace');
create type public.listing_status as enum ('draft', 'submitted', 'published', 'changes_requested', 'unpublished');
create type public.unit_status as enum ('available', 'occupied', 'reserved', 'maintenance');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id),
  title text not null,
  type public.property_type not null,
  description text not null,
  address text not null,
  barangay text not null,
  city text not null,
  province text not null,
  amenities text[] not null default '{}',
  house_rules text[] not null default '{}',
  available_from date not null,
  status public.listing_status not null default 'draft',
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  floor_area_sqm numeric(10,2) not null check (floor_area_sqm > 0),
  monthly_rent numeric(12,2) not null check (monthly_rent >= 0),
  deposit numeric(12,2) not null check (deposit >= 0),
  status public.unit_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, name)
);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  position integer not null check (position >= 0),
  mime_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now(),
  unique(property_id, position)
);
```

Enable RLS and explicit grants. Anonymous/authenticated public reads use policies requiring parent property `status = 'published'`; unit reads additionally require `status = 'available'` on list endpoints. Storage remains private, so the API signs only media belonging to a published property. Seed the existing six demo properties with stable UUIDs, mark only intended public records published, and preserve Philippine addresses and amounts.

- [ ] **Step 5: Implement normalized search and signed public media**

```ts
export async function listPublishedListings(filters: ListingFilters, deps: ListingDeps) {
  let query = deps.anon
    .from('properties')
    .select('*, units!inner(*), property_media(*)', { count: 'exact' })
    .eq('status', 'published')
    .eq('units.status', 'available')
    .order('published_at', { ascending: false });
  if (filters.city) query = query.ilike('city', filters.city);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.q) query = query.textSearch('search_document', filters.q, { type: 'websearch' });
  const { data, count, error } = await query;
  if (error) throw mapDatabaseError(error);
  return {
    items: await Promise.all((data ?? []).map((row) => toPublicSummary(row, deps.mediaSigner))),
    total: count ?? 0,
  };
}
```

Implement rent-range filtering against available units in SQL rather than filtering a paginated result in memory. Add a generated/search-indexed document for title, barangay, city, province, and property type. Signed media URLs expire after five minutes; the API never returns `storage_path`.

- [ ] **Step 6: Add the HTTP repository and preserve existing query behavior**

```ts
export class HttpRentDitoRepository implements RentDitoRepository {
  constructor(private readonly client: ApiClient) {}

  async listProperties(filters: ListingFilters = {}): Promise<Property[]> {
    const query = toListingSearchParams(filters);
    const response = await this.client.get(`/v1/listings?${query}`);
    return listingPageSchema.parse(response).items.map(fromPublicListing);
  }

  async getProperty(id: string): Promise<Property | null> {
    try {
      return fromPublicListing(publicPropertySchema.parse(
        await this.client.get(`/v1/listings/${encodeURIComponent(id)}`),
      ));
    } catch (error) {
      if (isApiProblem(error, 'LISTING_NOT_FOUND')) return null;
      throw error;
    }
  }
}
```

Keep the mock repository injectable in unit tests. Production composition selects `HttpRentDitoRepository` and fails startup if `VITE_API_BASE_URL` is absent. Preserve URL-owned filters, loading skeletons, empty results, responsive filter drawer state, and the legacy `/listings` redirect.

- [ ] **Step 7: Update marketplace assertions**

Change “Verified landlord” to “Listing reviewed.” Replace hard-coded six-result assumptions with the seeded API result. Add tests that a failed API request renders the existing retry state and that an expired signed image URL is refreshed by invalidating the listing query.

```ts
await page.goto('/?type=condominium');
await expect(page.getByText(/Showing 2 of 6 rentals/)).toBeVisible();
await page.getByRole('link', { name: /view .* details/i }).first().click();
await expect(page.getByText('Listing reviewed')).toBeVisible();
```

- [ ] **Step 8: Run the marketplace gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/listings.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/marketplace/marketplace.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/marketplace.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: only published seed listings appear, draft-ID access returns 404, and all commands exit 0.

- [ ] **Step 9: Release the marketplace**

Apply the listing migration and production-safe published seed, deploy the API, deploy the frontend with `marketplace=false`, compare listing counts between API and database, run search/detail smoke tests, then enable `marketplace=true`.

- [ ] **Step 10: Commit the marketplace**

```bash
git add packages/contracts supabase api/src/modules/listings api/test/listings.test.ts frontend/src/shared/api frontend/src/app/repositories.ts frontend/src/entities/property frontend/src/features/listing-search frontend/src/pages/marketplace frontend/e2e/marketplace.spec.ts
git commit -m "feat: connect the public marketplace"
```

---

### Task 3: Ship Landlord Listing Creation and Submission

**Feature release:** Landlords can create real inventory and submit it for review.

**Files:**
- Modify: `packages/contracts/src/listings.ts`
- Create: `supabase/migrations/202609090004_listing_authoring.sql`
- Create: `supabase/tests/database/004_listing_authoring_rls.test.sql`
- Create: `api/src/modules/landlordListings/routes.ts`
- Create: `api/src/modules/landlordListings/service.ts`
- Create: `api/src/modules/landlordListings/repository.ts`
- Create: `api/src/modules/media/service.ts`
- Create: `api/test/landlord-listings.test.ts`
- Create: `frontend/src/shared/api/http/landlordListingsApi.ts`
- Create: `frontend/src/features/property-editor/propertyDraftSchema.ts`
- Create: `frontend/src/features/property-editor/PropertyEditor.tsx`
- Create: `frontend/src/features/property-editor/UnitEditor.tsx`
- Create: `frontend/src/features/property-media/PropertyMediaManager.tsx`
- Create: `frontend/src/features/property-submit/SubmitListingButton.tsx`
- Create: `frontend/src/pages/landlord/CreatePropertyPage.tsx`
- Create: `frontend/src/pages/landlord/EditPropertyPage.tsx`
- Create: `frontend/src/pages/landlord/PreviewPropertyPage.tsx`
- Modify: `frontend/src/pages/landlord/PropertiesPage.tsx`
- Modify: `frontend/src/pages/landlord/PropertyDetailPage.tsx`
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/shared/lib/routes.ts`
- Create: `frontend/src/pages/landlord/listing-authoring.test.tsx`
- Create: `frontend/e2e/listing-authoring.spec.ts`

**Interfaces:**
- Produces: `POST /v1/landlord/properties -> LandlordProperty`
- Produces: `GET/PATCH /v1/landlord/properties/:propertyId`
- Produces: `POST/PATCH/DELETE /v1/landlord/properties/:propertyId/units[/:unitId]`
- Produces: `POST /v1/landlord/properties/:propertyId/media/uploads -> SignedUpload`
- Produces: `POST /v1/landlord/properties/:propertyId/media -> PropertyMedia`
- Produces: `PATCH /v1/landlord/properties/:propertyId/media/order`
- Produces: `POST /v1/landlord/properties/:propertyId/submit`
- Produces: `POST /v1/landlord/properties/:propertyId/unpublish`
- Consumes: Task 1 landlord actor and Task 2 listing tables

- [ ] **Step 1: Extend the listing contract for editable drafts**

```ts
export const propertyDraftInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  type: propertyTypeSchema,
  description: z.string().trim().min(40).max(5000),
  address: z.string().trim().min(5).max(160),
  barangay: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  amenities: z.array(z.string().trim().min(2).max(60)).max(30),
  houseRules: z.array(z.string().trim().min(2).max(160)).max(30),
  availableFrom: z.string().date(),
});

export const unitInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  floorAreaSqm: z.number().positive().max(10000),
  monthlyRent: z.number().min(0).max(10000000),
  deposit: z.number().min(0).max(10000000),
  status: unitStatusSchema,
});
```

`LandlordProperty` includes moderation status, timestamps, all owner-visible units/media, and the latest requested-changes reason. `SignedUpload` contains `uploadId`, `path`, `token`, and `expiresAt`; it never contains a service-role key.

- [ ] **Step 2: Write failing owner-scope and state-transition tests**

```ts
it('creates a landlord-owned draft and submits only when complete', async () => {
  const draft = await landlordRequest({
    method: 'POST',
    url: '/v1/landlord/properties',
    payload: validProperty,
  });
  expect(draft.statusCode).toBe(201);
  expect(draft.json().status).toBe('draft');

  const incomplete = await landlordRequest({
    method: 'POST',
    url: `/v1/landlord/properties/${draft.json().id}/submit`,
  });
  expect(incomplete.statusCode).toBe(422);
  expect(incomplete.json().code).toBe('LISTING_INCOMPLETE');
});

it('hides another landlord draft as not found', async () => {
  const response = await secondLandlordRequest({
    method: 'GET',
    url: `/v1/landlord/properties/${firstLandlordDraftId}`,
  });
  expect(response.statusCode).toBe(404);
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/landlord-listings.test.ts
npm run db:test
```

Expected: FAIL because landlord listing routes, write policies, and submit transition do not exist.

- [ ] **Step 4: Add owner policies and an atomic submit function**

```sql
grant select, insert, update, delete on public.properties, public.units, public.property_media to authenticated;

create policy "landlord owns property"
on public.properties for all to authenticated
using (
  landlord_id = (select auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'landlord'
)
with check (
  landlord_id = (select auth.uid())
  and (select role from public.profiles where id = auth.uid()) = 'landlord'
);

create policy "landlord owns property units"
on public.units for all to authenticated
using (exists (
  select 1 from public.properties p
  where p.id = units.property_id and p.landlord_id = (select auth.uid())
))
with check (exists (
  select 1 from public.properties p
  where p.id = units.property_id
    and p.landlord_id = (select auth.uid())
    and p.status in ('draft', 'changes_requested')
));
```

Create equivalent owner policy for `property_media`. Create `submit_listing(property_id uuid)` with a fixed empty search path. It locks the property, requires the actor to own it, requires at least one unit and one attached image, validates required text, accepts only `draft` or `changes_requested`, changes status to `submitted`, sets `submitted_at`, and inserts `listing.submitted` into `audit_events`. Create `unpublish_listing(property_id uuid)` to lock an owned published property, change it to `unpublished`, clear public visibility, and append `listing.unpublished`; the first subsequent validated edit transitions it to `draft`.

- [ ] **Step 5: Implement signed media upload and finalization**

```ts
export async function startPropertyUpload(actor: RequestActor, propertyId: string, input: UploadInput) {
  await requireEditableOwnedProperty(actor, propertyId);
  const extension = extensionForAllowedMime(input.mimeType);
  const uploadId = crypto.randomUUID();
  const path = `${actor.userId}/${propertyId}/${uploadId}.${extension}`;
  const { data, error } = await admin.storage
    .from('listing-media')
    .createSignedUploadUrl(path);
  if (error) throw mapStorageError(error);
  const { error: intentError } = await admin.from('upload_intents').insert({
    id: uploadId,
    owner_id: actor.userId,
    bucket_id: 'listing-media',
    storage_path: path,
    expected_mime_type: input.mimeType,
    expected_byte_size: input.byteSize,
  });
  if (intentError) throw mapDatabaseError(intentError);
  return { uploadId, path, token: data.token, expiresAt: addHours(clock.now(), 2) };
}
```

Finalization downloads only the object header and leading bytes needed to verify byte size and magic-byte MIME type. It rejects a mismatch, deletes the invalid object, and inserts `property_media` with the next position. Deleting media removes the database row first and schedules object cleanup; a failed Storage deletion is retried by `cleanupUploads.ts`.

- [ ] **Step 6: Implement the authoring routes and forms**

The API parses every request with the shared schemas, supplies `landlord_id` from the actor rather than the body, and returns 404 for non-owned identifiers. Mutations accept an `Idempotency-Key` header and use Task 0's `idempotency_records` contract for safe retries.

```tsx
const form = useForm<PropertyDraftInput>({
  resolver: zodResolver(propertyDraftInputSchema),
  defaultValues: fromDraft(property),
});
const save = useMutation({
  mutationFn: (values: PropertyDraftInput) =>
    landlordListingsApi.update(property.id, values),
  onSuccess: (saved) => {
    queryClient.setQueryData(listingAuthorKeys.detail(saved.id), saved);
    showToast({ title: 'Draft saved' });
  },
});
```

Create routes `/landlord/properties/new`, `/landlord/properties/:propertyId/edit`, and `/landlord/properties/:propertyId/preview`. Use one shared editor for create/edit, a nested unit editor, image previews with reorder/remove controls, explicit unsaved-change protection, autosave only after a valid first save, and a review dialog before submission. Submitted records render read-only controls. Published records expose only an explicit Unpublish action; its confirmation explains that the listing disappears from search immediately and all edits require another review.

- [ ] **Step 7: Add authoring integration and browser tests**

```tsx
it('preserves a rejected draft and shows every server field error', async () => {
  server.use(updateDraftHandler(() => HttpResponse.json({
    code: 'VALIDATION_FAILED',
    message: 'Check the highlighted fields.',
    requestId: 'req-1',
    fields: { title: 'Use at least 5 characters.' },
  }, { status: 422 })));
  renderApp({ route: '/landlord/properties/property-1/edit', auth: landlord });
  await userEvent.click(await screen.findByRole('button', { name: 'Save draft' }));
  expect(screen.getByLabelText('Property title')).toHaveValue('Home');
  expect(screen.getByText('Use at least 5 characters.')).toBeVisible();
});
```

Playwright creates a draft, adds a unit, uploads a fixture JPEG, reorders it, previews the page, submits, reloads, and verifies the status remains `Submitted for review`.

- [ ] **Step 8: Run the listing-authoring gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/landlord-listings.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/landlord/listing-authoring.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/listing-authoring.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: owner isolation, incomplete submission, upload validation, and the complete authoring journey pass.

- [ ] **Step 9: Release landlord listing creation**

Deploy the owner policies/RPC, then the API and frontend with `listing_authoring=false`. Create and submit a staging listing using a non-admin landlord, verify another landlord cannot retrieve it, then enable the flag. Do not enable admin decisions yet; submitted listings remain safely queued.

- [ ] **Step 10: Commit listing creation**

```bash
git add packages/contracts supabase api/src/modules/landlordListings api/src/modules/media api/test/landlord-listings.test.ts frontend/src/shared/api/http/landlordListingsApi.ts frontend/src/features/property-editor frontend/src/features/property-media frontend/src/features/property-submit frontend/src/pages/landlord frontend/src/app/router.tsx frontend/src/shared/lib/routes.ts frontend/e2e/listing-authoring.spec.ts
git commit -m "feat: add landlord listing authoring"
```

---

### Task 4: Ship Administrator Listing Moderation

**Feature release:** Dedicated administrator review and publication.

**Files:**
- Create: `packages/contracts/src/moderation.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609090005_listing_moderation.sql`
- Create: `supabase/tests/database/005_listing_moderation_rls.test.sql`
- Create: `api/src/modules/moderation/routes.ts`
- Create: `api/src/modules/moderation/service.ts`
- Create: `api/src/modules/moderation/repository.ts`
- Create: `api/test/moderation.test.ts`
- Create: `frontend/src/shared/api/http/moderationApi.ts`
- Create: `frontend/src/features/listing-review/ListingReviewDecision.tsx`
- Create: `frontend/src/pages/admin/AdminDashboardPage.tsx`
- Create: `frontend/src/pages/admin/ListingReviewQueuePage.tsx`
- Create: `frontend/src/pages/admin/ListingReviewPage.tsx`
- Create: `frontend/src/pages/admin/admin.module.css`
- Create: `frontend/src/pages/admin/moderation.test.tsx`
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/app/layouts/WorkspaceLayout.tsx`
- Modify: `frontend/src/shared/lib/routes.ts`
- Create: `frontend/e2e/moderation.spec.ts`

**Interfaces:**
- Produces: `GET /v1/admin/listings?status=submitted -> ReviewQueue`
- Produces: `GET /v1/admin/listings/:propertyId -> ReviewListing`
- Produces: `POST /v1/admin/listings/:propertyId/decision`
- Produces: `ReviewDecisionInput { decision: 'publish' | 'request_changes'; reason?: string }`
- Consumes: Task 1 admin actor and Task 3 submitted listing

- [ ] **Step 1: Define moderation contracts and decision requirements**

```ts
export const reviewDecisionInputSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('publish') }),
  z.object({
    decision: z.literal('request_changes'),
    reason: z.string().trim().min(10).max(1000),
  }),
]);

export const reviewQueueItemSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string(),
  landlordDisplayName: z.string(),
  submittedAt: z.string().datetime(),
  unitCount: z.number().int().nonnegative(),
  imageCount: z.number().int().nonnegative(),
  status: z.literal('submitted'),
});
```

- [ ] **Step 2: Write failing admin-only and concurrency tests**

```ts
it('publishes a submitted listing exactly once', async () => {
  const first = await adminRequest({
    method: 'POST',
    url: `/v1/admin/listings/${submittedId}/decision`,
    payload: { decision: 'publish' },
    headers: { 'idempotency-key': 'publish-submitted-1' },
  });
  expect(first.statusCode).toBe(200);
  expect(first.json().status).toBe('published');

  const second = await adminRequest({
    method: 'POST',
    url: `/v1/admin/listings/${submittedId}/decision`,
    payload: { decision: 'publish' },
    headers: { 'idempotency-key': 'publish-submitted-2' },
  });
  expect(second.statusCode).toBe(409);
  expect(second.json().code).toBe('LISTING_ALREADY_REVIEWED');
});

it('denies a landlord decision without revealing review data', async () => {
  const response = await landlordRequest({
    method: 'GET',
    url: `/v1/admin/listings/${submittedId}`,
  });
  expect(response.statusCode).toBe(403);
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run: `npm run test:run -w @rentdito/api -- test/moderation.test.ts`

Expected: FAIL because review records, RPC, and admin routes do not exist.

- [ ] **Step 4: Create review history and atomic decision RPC**

```sql
create type public.review_decision as enum ('publish', 'request_changes');

create table public.listing_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  reviewer_id uuid not null references public.profiles(id),
  submission_number integer not null,
  decision public.review_decision not null,
  reason text,
  decided_at timestamptz not null default now(),
  unique(property_id, submission_number),
  check (decision = 'publish' or char_length(reason) >= 10)
);

alter table public.listing_reviews enable row level security;
grant select on public.listing_reviews to authenticated;
```

Add policies so admins read all reviews and landlords read reviews for their own properties. Create `review_listing(property_id, decision, reason)` as a security-definer function with fixed search path. It verifies the actor is admin, locks the submitted property, assigns the next submission number, inserts the review, changes the property to `published` or `changes_requested`, sets/clears publication timestamps correctly, and appends an audit event. Replaying the same idempotency key returns the stored response; a different decision after review returns conflict.

- [ ] **Step 5: Implement moderation endpoints and the admin workspace**

```tsx
const decide = useMutation({
  mutationFn: (input: ReviewDecisionInput) =>
    moderationApi.decide(property.id, input, crypto.randomUUID()),
  onSuccess: async (reviewed) => {
    await queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    await queryClient.invalidateQueries({ queryKey: listingKeys.all });
    navigate(routes.admin.reviewQueue);
    showToast({
      title: reviewed.status === 'published' ? 'Listing published' : 'Changes requested',
    });
  },
});
```

Add an admin sidebar containing Overview and Listing reviews. Queue rows show title, landlord, submitted time, unit count, and media count. Review detail reuses the public listing preview component but displays moderation metadata separately. The decision dialog repeats property and landlord names. `Request changes` requires the reason inline and preserves it after a recoverable error.

- [ ] **Step 6: Add moderation UI and publication E2E tests**

```ts
test('admin publishes a submitted listing into public search', async ({ page }) => {
  await signInAs(page, 'admin_reviewer');
  await page.goto('/admin/listings');
  await page.getByRole('link', { name: /review sampaguita draft/i }).click();
  await page.getByRole('button', { name: 'Publish listing' }).click();
  await page.getByRole('button', { name: 'Confirm publication' }).click();
  await expect(page.getByText('Listing published')).toBeVisible();
  await signOut(page);
  await page.goto('/?q=Sampaguita draft');
  await expect(page.getByRole('heading', { name: 'Sampaguita draft' })).toBeVisible();
});
```

Add the complementary request-changes journey and assert the listing stays absent publicly while the landlord sees the exact reason.

- [ ] **Step 7: Run the moderation gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/moderation.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/admin/moderation.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/moderation.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: admin-only access, publication, requested changes, repeated decisions, owner visibility, and public visibility all pass.

- [ ] **Step 8: Release moderation**

Apply the review migration, deploy API/frontend with `listing_moderation=false`, provision a production admin through the server-only operation, submit a staging listing, exercise both decisions, then enable the flag. Verify no public registration request can create `admin`.

- [ ] **Step 9: Commit moderation**

```bash
git add packages/contracts supabase api/src/modules/moderation api/test/moderation.test.ts frontend/src/shared/api/http/moderationApi.ts frontend/src/features/listing-review frontend/src/pages/admin frontend/src/app frontend/src/shared/lib/routes.ts frontend/e2e/moderation.spec.ts
git commit -m "feat: add administrator listing moderation"
```

---

### Task 5: Ship Saved Listings and Inquiry Conversations

**Feature release:** Tenant favorites and tenant-landlord conversations.

**Files:**
- Create: `packages/contracts/src/inquiries.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609090006_saved_inquiries.sql`
- Create: `supabase/tests/database/006_saved_inquiries_rls.test.sql`
- Create: `api/src/modules/savedListings/routes.ts`
- Create: `api/src/modules/inquiries/routes.ts`
- Create: `api/src/modules/inquiries/service.ts`
- Create: `api/test/saved-inquiries.test.ts`
- Modify: `frontend/src/shared/api/http/HttpRentDitoRepository.ts`
- Modify: `frontend/src/features/saved-listings/SaveListingButton.tsx`
- Modify: `frontend/src/features/inquiry/InquiryForm.tsx`
- Modify: `frontend/src/entities/inquiry/model.ts`
- Modify: `frontend/src/entities/inquiry/InquiryTimeline.tsx`
- Modify: `frontend/src/pages/marketplace/SavedPage.tsx`
- Modify: `frontend/src/pages/marketplace/ListingDetailPage.tsx`
- Modify: `frontend/src/pages/landlord/LandlordInquiriesPage.tsx`
- Modify: `frontend/src/pages/tenant/TenantInquiriesPage.tsx`
- Create: `frontend/src/pages/inquiries.test.tsx`
- Modify: `frontend/e2e/marketplace.spec.ts`
- Modify: `frontend/e2e/landlord.spec.ts`

**Interfaces:**
- Produces: `GET/PUT/DELETE /v1/me/saved-listings[/:propertyId]`
- Produces: `POST /v1/listings/:propertyId/inquiries`
- Produces: `GET /v1/inquiries`
- Produces: `GET/POST /v1/inquiries/:inquiryId/messages`
- Produces: `InquiryThread { inquiry; property; participants; messages[] }`
- Consumes: Task 1 tenant/landlord actors and Task 2 published properties

- [ ] **Step 1: Define thread and saved-listing contracts**

```ts
export const inquiryMessageInputSchema = z.object({
  message: z.string().trim().min(5).max(2000),
});
export const inquiryMessageSchema = z.object({
  id: z.string().uuid(),
  senderRole: z.enum(['tenant', 'landlord']),
  message: z.string(),
  sentAt: z.string().datetime(),
});
export const inquiryThreadSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  propertyTitle: z.string(),
  status: z.enum(['open', 'closed']),
  messages: z.array(inquiryMessageSchema),
  lastActivityAt: z.string().datetime(),
});
```

- [ ] **Step 2: Write failing participant-isolation tests**

```ts
it('allows only the tenant and property landlord to read a thread', async () => {
  const tenantView = await tenantRequest({ method: 'GET', url: `/v1/inquiries/${threadId}` });
  expect(tenantView.statusCode).toBe(200);
  const strangerView = await otherTenantRequest({ method: 'GET', url: `/v1/inquiries/${threadId}` });
  expect(strangerView.statusCode).toBe(404);
});

it('requires a tenant account to create an inquiry', async () => {
  const response = await anonymousRequest({
    method: 'POST',
    url: `/v1/listings/${publishedId}/inquiries`,
    payload: { message: 'May I schedule a viewing this Saturday?' },
  });
  expect(response.statusCode).toBe(401);
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/saved-inquiries.test.ts
npm run db:test
```

Expected: FAIL because saved-listing and inquiry tables/routes do not exist.

- [ ] **Step 4: Create normalized saves, threads, messages, and RLS**

```sql
create table public.saved_listings (
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (tenant_id, property_id)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  tenant_id uuid not null references public.profiles(id),
  landlord_id uuid not null references public.profiles(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  message text not null check (char_length(message) between 5 and 2000),
  sent_at timestamptz not null default now()
);
```

Enable RLS. Saved rows require `tenant_id = auth.uid()` and a tenant profile. Inquiry/message selects require the actor to equal `tenant_id` or `landlord_id`; inserts require an open thread and a matching participant. Inquiry creation derives `landlord_id` from the published property in an RPC, inserts the opening message, and never trusts either participant ID from the client.

- [ ] **Step 5: Implement idempotent save and conversation endpoints**

```ts
app.put('/v1/me/saved-listings/:propertyId', { preHandler: requireRole('tenant') }, async (request) => {
  const { propertyId } = propertyIdParams.parse(request.params);
  await savedListings.save(request.actor, propertyId);
  return { saved: true };
});

app.delete('/v1/me/saved-listings/:propertyId', { preHandler: requireRole('tenant') }, async (request) => {
  const { propertyId } = propertyIdParams.parse(request.params);
  await savedListings.remove(request.actor, propertyId);
  return { saved: false };
});
```

List threads newest-activity-first. A landlord reply updates `last_activity_at` transactionally. Reject messages on closed threads. Use 404 for a thread outside the actor's scope.

- [ ] **Step 6: Connect the existing save and inquiry interfaces**

Guests keep saves under a versioned local key. After tenant login, offer one explicit “Add device saves to my account” action; never merge automatically into a landlord account. An unsigned inquiry action navigates to sign-in with `returnTo`; after successful tenant login it reopens the same listing, but does not auto-send the previous text.

Replace the single `reply` field model with ordered messages. Keep the existing timeline markup and accessible labels. Update success text from “saved in this prototype” to “Inquiry sent” or “Reply sent.”

- [ ] **Step 7: Add integration and E2E tests**

```tsx
it('prompts a guest to sign in and restores the listing destination', async () => {
  renderApp({ route: '/listings/property-1', auth: null });
  await userEvent.click(await screen.findByRole('button', { name: 'Inquire about this property' }));
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  expect(currentLocation().state.returnTo.pathname).toBe('/listings/property-1');
});
```

Playwright saves a listing, reloads the saved page, opens an inquiry as a tenant, replies as the owning landlord, returns as the tenant, and verifies chronological persistence. A second tenant must not locate the thread.

- [ ] **Step 8: Run the save/inquiry gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/saved-inquiries.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/inquiries.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/marketplace.spec.ts e2e/landlord.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: participant isolation, durable saves, login return, message chronology, and all existing marketplace behavior pass.

- [ ] **Step 9: Release saves and inquiries**

Deploy schema/API/frontend with `saved_inquiries=false`. Use two tenant accounts and two landlord accounts in staging to prove saves and threads do not cross boundaries, then enable the flag.

- [ ] **Step 10: Commit saves and inquiries**

```bash
git add packages/contracts supabase api/src/modules/savedListings api/src/modules/inquiries api/test/saved-inquiries.test.ts frontend/src/shared/api frontend/src/features/saved-listings frontend/src/features/inquiry frontend/src/entities/inquiry frontend/src/pages frontend/e2e
git commit -m "feat: add saved listings and inquiries"
```

---

### Task 6: Ship One-Time Tenancy Invitations

**Feature release:** Landlords can invite a tenant into a unit and activate a rental relationship.

**Files:**
- Create: `packages/contracts/src/tenancies.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609090007_tenancy_invitations.sql`
- Create: `supabase/tests/database/007_tenancy_invitations.test.sql`
- Create: `api/src/modules/invitations/routes.ts`
- Create: `api/src/modules/invitations/service.ts`
- Create: `api/src/modules/invitations/repository.ts`
- Create: `api/test/invitations.test.ts`
- Create: `frontend/src/shared/api/http/invitationsApi.ts`
- Create: `frontend/src/features/tenancy-invite/tenancyInviteSchema.ts`
- Create: `frontend/src/features/tenancy-invite/CreateTenancyInvite.tsx`
- Create: `frontend/src/features/tenancy-invite/AcceptTenancyInvite.tsx`
- Create: `frontend/src/pages/landlord/InvitationsPage.tsx`
- Create: `frontend/src/pages/tenant/InvitationPage.tsx`
- Modify: `frontend/src/pages/landlord/PropertyDetailPage.tsx`
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/shared/lib/routes.ts`
- Create: `frontend/src/pages/invitations.test.tsx`
- Create: `frontend/e2e/invitations.spec.ts`

**Interfaces:**
- Produces: `POST /v1/landlord/invitations -> { invitation; secretCode }`
- Produces: `GET /v1/landlord/invitations`
- Produces: `POST /v1/landlord/invitations/:invitationId/revoke`
- Produces: `POST /v1/invitations/resolve { code } -> PublicInvitationTerms`
- Produces: `POST /v1/invitations/accept { code } -> Tenancy`
- Consumes: Task 1 actors and Task 3 landlord-owned eligible units

- [ ] **Step 1: Define invitation and tenancy contracts**

```ts
export const tenancyInviteInputSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  tenantDisplayName: z.string().trim().min(2).max(80),
  monthlyRent: z.number().positive().max(10000000),
  deposit: z.number().min(0).max(10000000),
  startDate: z.string().date(),
  endDate: z.string().date(),
  paymentDueDay: z.number().int().min(1).max(28),
}).refine((value) => value.startDate < value.endDate, {
  message: 'Lease end must be after lease start.',
  path: ['endDate'],
});

export const invitationStatusSchema = z.enum(['pending', 'accepted', 'revoked', 'expired']);
export const tenancyStatusSchema = z.enum(['pending', 'active', 'ended']);
```

`PublicInvitationTerms` exposes property title/address, unit name, tenant display name, rent, deposit, dates, due day, landlord display name, and effective status. It never exposes the token digest or unrelated landlord/tenant data.

- [ ] **Step 2: Write failing single-use and role tests**

```ts
it('accepts an invitation exactly once', async () => {
  const first = await tenantRequest({
    method: 'POST',
    url: '/v1/invitations/accept',
    payload: { code: secretCode },
    headers: { 'idempotency-key': 'accept-invite-1' },
  });
  expect(first.statusCode).toBe(200);
  expect(first.json().tenantId).toBe(tenantId);

  const reused = await otherTenantRequest({
    method: 'POST',
    url: '/v1/invitations/accept',
    payload: { code: secretCode },
    headers: { 'idempotency-key': 'accept-invite-2' },
  });
  expect(reused.statusCode).toBe(410);
  expect(reused.json().code).toBe('INVITATION_UNAVAILABLE');
});

it('does not allow a landlord to accept a tenant invitation', async () => {
  const response = await landlordRequest({
    method: 'POST',
    url: '/v1/invitations/accept',
    payload: { code: secretCode },
  });
  expect(response.statusCode).toBe(403);
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/invitations.test.ts
npm run db:test
```

Expected: FAIL because invitation/tenancy tables and acceptance logic do not exist.

- [ ] **Step 4: Create invitation and tenancy tables with collision guards**

```sql
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');
create type public.tenancy_status as enum ('pending', 'active', 'ended');

create table public.tenancy_invitations (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id),
  property_id uuid not null references public.properties(id),
  unit_id uuid not null references public.units(id),
  token_digest bytea not null unique,
  tenant_display_name text not null,
  monthly_rent numeric(12,2) not null check (monthly_rent > 0),
  deposit numeric(12,2) not null check (deposit >= 0),
  start_date date not null,
  end_date date not null,
  payment_due_day integer not null check (payment_due_day between 1 and 28),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (start_date < end_date)
);

create table public.tenancies (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.tenancy_invitations(id),
  tenant_id uuid not null references public.profiles(id),
  landlord_id uuid not null references public.profiles(id),
  property_id uuid not null references public.properties(id),
  unit_id uuid not null references public.units(id),
  status public.tenancy_status not null,
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(12,2) not null,
  deposit numeric(12,2) not null,
  payment_due_day integer not null,
  accepted_at timestamptz not null,
  ended_at timestamptz
);
```

Add a partial unique index preventing more than one pending/active tenancy per unit. RLS lets landlords read invitations they created, accepted tenants read their tenancy, and each party read the resulting shared rental. No policy permits selecting `token_digest` through the client-facing role.

- [ ] **Step 5: Implement secret generation and transactional acceptance**

```ts
export function createInvitationSecret() {
  return crypto.randomBytes(32).toString('base64url');
}
export function digestInvitationSecret(secret: string) {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}
```

Creation verifies the landlord owns a published property, the unit is available, and no live invitation/tenancy conflicts. Store only the SHA-256 digest and return the plaintext code once. Set expiration to seven days.

Implement `accept_tenancy_invitation(token_digest bytea)` transactionally: lock the invitation and unit; reject expired, revoked, accepted, or conflicting records with the same public unavailable response; require a tenant actor; create one tenancy; mark the invitation accepted; set the unit to `reserved` when start date is future or `occupied` when current; append audit events.

- [ ] **Step 6: Build invitation creation, copy, resolution, and acceptance UI**

The landlord form shows property/unit and every lease term before confirmation. After creation, display the link and code with copy buttons and an explicit warning that the secret is shown only now. The invitations list shows status derived as expired when a pending record's expiration is past and supports revocation.

The shared link places the secret after `/invite#code=`; URL fragments are not sent in Vercel or Render HTTP requests. The React route reads the fragment, immediately removes it from visible browser history with `history.replaceState`, keeps the code only in component memory, and sends it in redacted POST bodies to the resolve/accept endpoints. If signed out, registration/sign-in preserves the invitation in session storage until completion. If signed in with a landlord/admin role, explain that a tenant account is required. Acceptance repeats all terms and requires an explicit checkbox.

```tsx
<Field label="Confirm the tenancy terms" required error={termsError}>
  <label>
    <input type="checkbox" {...register('acceptedTerms')} />
    I agree that these are the rental terms I am accepting.
  </label>
</Field>
```

- [ ] **Step 7: Add invitation database, UI, and browser edge cases**

Test expired code, revoked code, reused code, wrong role, conflicting unit, future-start reservation, current-start occupancy, refresh after acceptance, and safe display of an unknown code. The browser journey creates the invite as a landlord, copies the route from the response fixture, registers a new tenant, accepts, and sees the rental shell.

- [ ] **Step 8: Run the invitation gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/invitations.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/invitations.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/invitations.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: all invitation lifecycle, concurrency, role, unit-state, and browser tests pass.

- [ ] **Step 9: Release tenancy invitations**

Deploy migration/API/frontend with `tenancy_invitations=false`. Generate and accept one current and one future staging invite, attempt reuse and revocation, verify audit entries, then enable the flag.

- [ ] **Step 10: Commit tenancy invitations**

```bash
git add packages/contracts supabase api/src/modules/invitations api/test/invitations.test.ts frontend/src/shared/api/http/invitationsApi.ts frontend/src/features/tenancy-invite frontend/src/pages frontend/src/app/router.tsx frontend/src/shared/lib/routes.ts frontend/e2e/invitations.spec.ts
git commit -m "feat: add one-time tenancy invitations"
```

---

### Task 7: Ship Tenant Rental Records and Automatic Monthly Dues

**Feature release:** Tenants see their accepted rental, dues, and payment history from authoritative data.

**Files:**
- Create: `packages/contracts/src/billing.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `supabase/migrations/202609090008_billing.sql`
- Create: `supabase/tests/database/008_billing.test.sql`
- Create: `api/src/modules/tenantRecords/routes.ts`
- Create: `api/src/modules/tenantRecords/service.ts`
- Create: `api/src/modules/billing/repository.ts`
- Create: `api/src/jobs/generateDues.ts`
- Create: `api/test/tenant-records.test.ts`
- Create: `api/test/generate-dues.test.ts`
- Modify: `render.yaml`
- Modify: `frontend/src/shared/api/http/HttpRentDitoRepository.ts`
- Modify: `frontend/src/entities/tenancy/model.ts`
- Modify: `frontend/src/entities/payment/model.ts`
- Modify: `frontend/src/entities/payment/status.ts`
- Modify: `frontend/src/features/tenancy/useTenantRecords.ts`
- Modify: `frontend/src/pages/tenant/TenantDashboardPage.tsx`
- Modify: `frontend/src/pages/tenant/CurrentRentalPage.tsx`
- Modify: `frontend/src/pages/tenant/TenantPaymentsPage.tsx`
- Modify: `frontend/src/pages/tenant/payment.test.tsx`
- Modify: `frontend/e2e/tenant-payment.spec.ts`

**Interfaces:**
- Produces: `GET /v1/tenant/rental -> TenantRental | 204`
- Produces: `GET /v1/tenant/dues -> Due[]`
- Produces: `GET /v1/tenant/payments -> Payment[]`
- Produces: `generate_monthly_dues(as_of date) -> integer`
- Produces: `advance_tenancies(as_of date) -> integer`
- Consumes: Task 6 accepted tenancy and Task 2 property/unit display data

- [ ] **Step 1: Define billing contracts and one due-status function**

```ts
export const paymentMethodSchema = z.enum(['gcash', 'maya', 'bank_transfer', 'cash', 'other']);
export const dueStatusSchema = z.enum([
  'upcoming', 'due', 'overdue', 'partially_paid', 'proof_pending', 'paid',
]);
export const dueSchema = z.object({
  id: z.string().uuid(),
  tenancyId: z.string().uuid(),
  billingPeriod: z.string().date(),
  label: z.string(),
  amount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  outstandingAmount: z.number().nonnegative(),
  dueDate: z.string().date(),
  status: dueStatusSchema,
});
export const paymentSchema = z.object({
  id: z.string().uuid(),
  dueId: z.string().uuid(),
  amount: z.number().positive(),
  method: paymentMethodSchema,
  source: z.enum(['landlord', 'approved_proof']),
  recordedAt: z.string().datetime(),
});
```

Delete frontend-only assumptions about fixed demo user IDs. The API derives tenancy scope from the token. Keep one pure `deriveDueStatus({ dueDate, amount, paidAmount, hasPendingProof, today })` function shared by API tests and frontend presentation.

- [ ] **Step 2: Write failing idempotent-generation and tenant-scope tests**

```ts
it('generates one due per tenancy billing month when called twice', async () => {
  const first = await runGenerateDues('2026-10-01');
  const second = await runGenerateDues('2026-10-01');
  expect(first.createdCount).toBe(1);
  expect(second.createdCount).toBe(0);
  expect(await countDues(activeTenancyId, '2026-10-01')).toBe(1);
});

it('returns only the signed-in tenant rental', async () => {
  const response = await tenantRequest({ method: 'GET', url: '/v1/tenant/rental' });
  expect(response.statusCode).toBe(200);
  expect(response.json().tenantId).toBe(tenantId);
  expect(JSON.stringify(response.json())).not.toContain(otherTenantId);
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/tenant-records.test.ts test/generate-dues.test.ts
npm run db:test
```

Expected: FAIL because due/payment tables, generation functions, and tenant endpoints do not exist.

- [ ] **Step 4: Create due/payment ledgers and transactional generation**

```sql
create table public.dues (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id),
  billing_period date not null check (billing_period = date_trunc('month', billing_period)::date),
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  created_at timestamptz not null default now(),
  unique(tenancy_id, billing_period)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  due_id uuid not null references public.dues(id),
  tenancy_id uuid not null references public.tenancies(id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('gcash', 'maya', 'bank_transfer', 'cash', 'other')),
  source text not null check (source in ('landlord', 'approved_proof')),
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now()
);
```

Enable RLS: tenants read dues/payments for their tenancy; landlords read those tied to their properties; neither role inserts or updates ledgers directly. Create an indexed payment-total view using `security_invoker = true`, or calculate the sum in scoped queries.

`generate_monthly_dues(as_of)` inserts dues for active tenancies whose period overlaps the lease and uses `on conflict (tenancy_id, billing_period) do nothing`. Due dates use `payment_due_day` capped at 28 by the invitation contract. `advance_tenancies(as_of)` activates future tenancies on their start date, occupies the unit, ends expired tenancies, and releases the unit only when no other pending/active tenancy exists.

- [ ] **Step 5: Implement the Render due-generation job**

```ts
// api/src/jobs/generateDues.ts
const asOf = process.env.JOB_DATE ?? new Date().toISOString().slice(0, 10);
const { data: advanced, error: advanceError } = await admin.rpc('advance_tenancies', { as_of: asOf });
if (advanceError) throw advanceError;
const { data: created, error: dueError } = await admin.rpc('generate_monthly_dues', { as_of: asOf });
if (dueError) throw dueError;
logger.info({ asOf, advanced, created }, 'billing generation completed');
process.exitCode = 0;
```

Add a Render cron service:

```yaml
  - type: cron
    name: rentdito-generate-dues
    runtime: node
    schedule: "5 16 * * *"
    rootDir: .
    buildCommand: npm ci && npm run build -w @rentdito/contracts && npm run build -w @rentdito/api
    startCommand: npm run job:generate-dues -w @rentdito/api
```

The 16:05 UTC schedule runs at 00:05 in Asia/Manila. The job exits after one run and logs counts without tenant data.

- [ ] **Step 6: Implement tenant-scoped record endpoints**

```ts
app.get('/v1/tenant/rental', { preHandler: requireRole('tenant') }, async (request, reply) => {
  const rental = await tenantRecords.getCurrentRental(request.actor);
  return rental ? tenantRentalSchema.parse(rental) : reply.code(204).send();
});
app.get('/v1/tenant/dues', { preHandler: requireRole('tenant') }, async (request) =>
  dueListSchema.parse(await tenantRecords.listDues(request.actor)));
app.get('/v1/tenant/payments', { preHandler: requireRole('tenant') }, async (request) =>
  paymentListSchema.parse(await tenantRecords.listPayments(request.actor)));
```

Sort dues by due date ascending and payments by recorded time descending. Return computed `paidAmount`, `outstandingAmount`, and status. Do not return invitation secrets, Storage paths, or another tenant's profile.

- [ ] **Step 7: Connect tenant pages and replace simulation copy**

Refactor `useTenantRecords` to query the three tenant endpoints, join only view data, and invalidate by tenant-specific query keys. Dashboard leads with the earliest outstanding due. Current Rental shows accepted terms. Payments shows dues and approved/manual payment history. Hide the existing simulated checkout entry until Task 8 enables proof uploads; its action reads `Submit receipt`, not `Pay now`.

```tsx
const [rental, dues, payments] = useQueries({
  queries: [
    { queryKey: tenantKeys.rental, queryFn: tenantApi.getRental },
    { queryKey: tenantKeys.dues, queryFn: tenantApi.listDues },
    { queryKey: tenantKeys.payments, queryFn: tenantApi.listPayments },
  ],
});
```

- [ ] **Step 8: Add billing and tenant page tests**

Cover a tenant with no rental, pending future tenancy, active tenancy, fully paid account, partial payment, overdue due, and two tenants under the same landlord. Run the cron function twice in the database test and assert one row.

```tsx
it('leads with the earliest outstanding due from the API', async () => {
  renderApp({ route: '/tenant', auth: tenant });
  const due = await screen.findByRole('region', { name: 'Next payment due' });
  expect(within(due).getByText('₱18,000')).toBeVisible();
  expect(within(due).getByText('Oct 1, 2026')).toBeVisible();
});
```

- [ ] **Step 9: Run the billing gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/tenant-records.test.ts test/generate-dues.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/tenant/payment.test.tsx
JOB_DATE=2026-10-01 npm run job:generate-dues -w @rentdito/api
npm run e2e -w @rentdito/frontend -- e2e/tenant-payment.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: one due per period, correct tenant scoping and balances, and every command exits 0. On PowerShell, set `$env:JOB_DATE='2026-10-01'` before the job command and remove only that task-specific variable afterward.

- [ ] **Step 10: Release tenant billing**

Deploy the migration/API/frontend and the disabled cron definition with `tenant_billing=false`. Trigger the staging cron manually twice and confirm only one due is created. Enable the feature, then enable the production cron after confirming its environment points only to production Supabase.

- [ ] **Step 11: Commit tenant billing**

```bash
git add packages/contracts supabase api/src/modules/tenantRecords api/src/modules/billing api/src/jobs/generateDues.ts api/test render.yaml frontend/src/shared/api frontend/src/entities frontend/src/features/tenancy frontend/src/pages/tenant frontend/e2e/tenant-payment.spec.ts
git commit -m "feat: add tenant rental and monthly dues"
```

---

### Task 8: Ship Receipt Upload and Landlord Approval

**Feature release:** Tenants submit payment proof; landlords decide; only approval settles a due.

**Files:**
- Modify: `packages/contracts/src/billing.ts`
- Create: `supabase/migrations/202609090009_payment_proofs.sql`
- Create: `supabase/tests/database/009_payment_proofs.test.sql`
- Create: `api/src/modules/paymentProofs/routes.ts`
- Create: `api/src/modules/paymentProofs/service.ts`
- Create: `api/src/modules/paymentProofs/repository.ts`
- Create: `api/test/payment-proofs.test.ts`
- Create: `frontend/src/shared/api/http/paymentProofsApi.ts`
- Create: `frontend/src/entities/paymentProof/model.ts`
- Create: `frontend/src/features/payment-proof/SubmitPaymentProof.tsx`
- Create: `frontend/src/features/payment-proof/ReviewPaymentProof.tsx`
- Create: `frontend/src/pages/tenant/PaymentProofPage.tsx`
- Modify: `frontend/src/pages/tenant/PayDuePage.tsx`
- Modify: `frontend/src/pages/tenant/ReceiptPage.tsx`
- Modify: `frontend/src/pages/tenant/TenantPaymentsPage.tsx`
- Modify: `frontend/src/pages/landlord/LandlordPaymentsPage.tsx`
- Modify: `frontend/src/shared/lib/routes.ts`
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/pages/tenant/payment.test.tsx`
- Create: `frontend/src/pages/landlord/payment-review.test.tsx`
- Modify: `frontend/e2e/tenant-payment.spec.ts`
- Create: `frontend/e2e/payment-proof-review.spec.ts`
- Remove from production: `frontend/src/features/payment/PayNowFlow.tsx`
- Remove from production: `frontend/src/features/payment/payNowSchema.ts`

**Interfaces:**
- Produces: `POST /v1/tenant/dues/:dueId/proofs/uploads -> SignedUpload`
- Produces: `POST /v1/tenant/dues/:dueId/proofs -> PaymentProof`
- Produces: `GET /v1/tenant/payment-proofs/:proofId`
- Produces: `GET /v1/tenant/payment-proofs/:proofId/view -> { url; expiresAt }`
- Produces: `GET /v1/landlord/payment-proofs?status=submitted`
- Produces: `GET /v1/landlord/payment-proofs/:proofId/view -> { url; expiresAt }`
- Produces: `POST /v1/landlord/payment-proofs/:proofId/decision`
- Consumes: Task 7 due/payment ledgers and Task 0 private `payment-proofs` bucket

- [ ] **Step 1: Define proof contracts and the approval/rejection union**

```ts
export const paymentProofStatusSchema = z.enum(['submitted', 'approved', 'rejected']);
export const paymentProofSubmissionSchema = z.object({
  uploadId: z.string().uuid(),
  storagePath: z.string().min(1),
  method: paymentMethodSchema.exclude(['cash']),
  originalFileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  byteSize: z.number().int().positive().max(5 * 1024 * 1024),
});
export const paymentProofDecisionSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({
    decision: z.literal('reject'),
    reason: z.string().trim().min(10).max(1000),
  }),
]);
```

The server ignores any client-supplied amount; approval always uses the due's locked outstanding balance. Client contracts never expose a raw private Storage path except during the tenant's upload finalization request.

- [ ] **Step 2: Write the failing money-safety and privacy tests**

```ts
it('submitting proof does not reduce the balance', async () => {
  const before = await dueBalance(dueId);
  const response = await submitProof(tenant, dueId, validUpload);
  expect(response.statusCode).toBe(201);
  expect(response.json().status).toBe('submitted');
  expect(await dueBalance(dueId)).toBe(before);
  expect(await paymentCount(dueId)).toBe(0);
});

it('approval creates one full payment under concurrent requests', async () => {
  const [left, right] = await Promise.all([
    decideProof(landlord, proofId, 'approve', 'approval-a'),
    decideProof(landlord, proofId, 'approve', 'approval-b'),
  ]);
  expect([left.statusCode, right.statusCode].sort()).toEqual([200, 409]);
  expect(await paymentCount(dueId)).toBe(1);
  expect(await dueBalance(dueId)).toBe(0);
});

it('does not issue a receipt URL to an unrelated landlord', async () => {
  const response = await otherLandlordRequest({
    method: 'GET',
    url: `/v1/landlord/payment-proofs/${proofId}/view`,
  });
  expect(response.statusCode).toBe(404);
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/payment-proofs.test.ts
npm run db:test
```

Expected: FAIL because proof persistence, private-view authorization, and decision transaction do not exist.

- [ ] **Step 4: Create proof records and enforce one actionable proof per due**

```sql
create type public.payment_proof_status as enum ('submitted', 'approved', 'rejected');

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  due_id uuid not null references public.dues(id),
  tenancy_id uuid not null references public.tenancies(id),
  tenant_id uuid not null references public.profiles(id),
  landlord_id uuid not null references public.profiles(id),
  storage_path text not null unique,
  original_file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 5242880),
  method text not null check (method in ('gcash', 'maya', 'bank_transfer', 'other')),
  status public.payment_proof_status not null default 'submitted',
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);

create unique index one_submitted_proof_per_due
on public.payment_proofs(due_id)
where status = 'submitted';

alter table public.payments
add column payment_proof_id uuid unique references public.payment_proofs(id);
```

RLS lets the submitting tenant and owning landlord read metadata, while Storage object reads stay server-signed. Neither role directly updates proof status or inserts payments.

- [ ] **Step 5: Implement upload finalization and transactional review**

Use the same signed-upload primitive as listing media but generate `${tenantId}/${dueId}/${uploadId}.${extension}`. Finalization verifies the tenant owns the due, the balance is positive, no proof is pending, the object belongs to the issued upload, the magic-byte type matches, and the size is at most 5 MiB.

Create `review_payment_proof(proof_id, decision, reason)` with fixed search path. It locks proof and due, verifies the actor owns the tenancy as landlord, and:

- On reject, requires at least ten trimmed characters, sets rejection fields, writes an audit event, and changes no payment.
- On approve, calculates the current payment sum while locked, rejects an already settled due, inserts one payment for the full remaining balance with source `approved_proof` and the unique `payment_proof_id`, marks the proof approved, and writes the audit event.

When Task 9 manually settles a due with a submitted proof, the same transaction marks that proof rejected with reason `Due settled through a landlord-recorded payment.` so it cannot later be approved.

- [ ] **Step 6: Replace simulated checkout with receipt submission**

```tsx
const submit = useMutation({
  mutationFn: async (file: File) => {
    const upload = await paymentProofsApi.startUpload(due.id, {
      mimeType: file.type,
      byteSize: file.size,
    });
    await uploadToSignedUrl(upload, file);
    return paymentProofsApi.finalize(due.id, {
      uploadId: upload.uploadId,
      storagePath: upload.path,
      method,
      originalFileName: file.name,
      mimeType: file.type,
      byteSize: file.size,
    });
  },
  onSuccess: async (proof) => {
    await queryClient.invalidateQueries({ queryKey: tenantKeys.dues });
    navigate(routes.tenant.paymentProof(proof.id));
  },
});
```

The UI displays accepted formats and 5 MiB limit before selection, shows an image preview, names the due and full outstanding balance, and requires review before submission. It does not ask for account number, card number, CVV, or OTP. A pending proof replaces the submission action with its status. A rejected proof shows the reason and allows a fresh upload.

- [ ] **Step 7: Build landlord review queue and decision UI**

Place pending proof count and queue at the top of Landlord Payments. Each item shows tenant, property, unit, billing period, amount awaiting confirmation, method, and submitted time. Opening it requests a fresh five-minute view URL. The approve dialog states that approval will mark the full remaining balance paid. The reject dialog requires a reason.

```tsx
<Dialog title="Approve this payment proof?" open={decision === 'approve'}>
  <p>Approve {formatCurrency(proof.outstandingAmount)} for {proof.tenantName}?</p>
  <p>This creates a payment record and marks the due paid.</p>
  <Button onClick={() => review.mutate({ decision: 'approve' })}>
    Approve and mark paid
  </Button>
</Dialog>
```

- [ ] **Step 8: Add receipt workflow tests**

Browser tests submit an image, verify the tenant still sees the balance and `Proof pending`, sign in as the owning landlord, reject once, resubmit, approve, then return as tenant and verify `Paid` plus a durable payment record. Separate tests cover offline submission, oversized files, renamed non-images, another landlord, duplicate click, and manual settlement conflict.

- [ ] **Step 9: Run the proof gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/payment-proofs.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/tenant/payment.test.tsx src/pages/landlord/payment-review.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/tenant-payment.spec.ts e2e/payment-proof-review.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: proof submission never changes money, only one approval creates one payment, rejection preserves the due, private images remain participant-scoped, and all commands exit 0.

- [ ] **Step 10: Release payment proofs**

Deploy migration/API/frontend with `payment_proofs=false`. Use separate tenant, owning-landlord, and unrelated-landlord staging sessions to test upload, private viewing, rejection, resubmission, approval, and duplicate approval. Confirm logs contain no signed URL or receipt content, then enable the feature.

- [ ] **Step 11: Commit payment proofs**

```bash
git add packages/contracts supabase api/src/modules/paymentProofs api/test/payment-proofs.test.ts frontend/src/shared/api/http/paymentProofsApi.ts frontend/src/entities/paymentProof frontend/src/features/payment-proof frontend/src/pages frontend/src/shared/lib/routes.ts frontend/src/app/router.tsx frontend/e2e
git commit -m "feat: add receipt proof review workflow"
```

---

### Task 9: Ship the Complete Landlord Operations Workspace

**Feature release:** Portfolio, unit, tenant, due, and manual-payment operations use production data.

**Files:**
- Modify: `packages/contracts/src/listings.ts`
- Modify: `packages/contracts/src/tenancies.ts`
- Modify: `packages/contracts/src/billing.ts`
- Create: `supabase/migrations/202609090010_landlord_operations.sql`
- Create: `supabase/tests/database/010_landlord_operations.test.sql`
- Create: `api/src/modules/landlordOperations/routes.ts`
- Create: `api/src/modules/landlordOperations/service.ts`
- Create: `api/src/modules/landlordOperations/repository.ts`
- Create: `api/test/landlord-operations.test.ts`
- Create: `frontend/src/shared/api/http/landlordOperationsApi.ts`
- Modify: `frontend/src/features/portfolio/useLandlordRecords.ts`
- Modify: `frontend/src/features/portfolio/usePortfolioSummary.ts`
- Modify: `frontend/src/features/unit-status/useUpdateUnitStatus.ts`
- Modify: `frontend/src/features/unit-status/UnitStatusForm.tsx`
- Modify: `frontend/src/features/payment/RecordPaymentForm.tsx`
- Create: `frontend/src/features/tenancy/EndTenancyButton.tsx`
- Modify: `frontend/src/pages/landlord/LandlordDashboardPage.tsx`
- Modify: `frontend/src/pages/landlord/PropertiesPage.tsx`
- Modify: `frontend/src/pages/landlord/PropertyDetailPage.tsx`
- Modify: `frontend/src/pages/landlord/TenantsPage.tsx`
- Modify: `frontend/src/pages/landlord/TenantDetailPage.tsx`
- Modify: `frontend/src/pages/landlord/LandlordPaymentsPage.tsx`
- Modify: `frontend/src/pages/landlord/properties.test.tsx`
- Modify: `frontend/src/pages/landlord/operations.test.tsx`
- Modify: `frontend/e2e/landlord.spec.ts`

**Interfaces:**
- Produces: `GET /v1/landlord/overview -> PortfolioSummary`
- Produces: `GET /v1/landlord/properties`
- Produces: `GET /v1/landlord/tenancies[/:tenancyId]`
- Produces: `GET /v1/landlord/dues`
- Produces: `GET /v1/landlord/payments`
- Produces: `POST /v1/landlord/units/:unitId/status`
- Produces: `POST /v1/landlord/tenancies/:tenancyId/end`
- Produces: `POST /v1/landlord/dues/:dueId/payments`
- Consumes: Tasks 2-8 authoritative property, tenancy, inquiry, due, payment, and proof data

- [ ] **Step 1: Define aggregate and mutation contracts**

```ts
export const portfolioSummarySchema = z.object({
  expectedThisMonth: z.number().nonnegative(),
  collectedThisMonth: z.number().nonnegative(),
  overdueAmount: z.number().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  occupiedCount: z.number().int().nonnegative(),
  unitCount: z.number().int().nonnegative(),
  occupancyRate: z.number().min(0).max(1),
  vacantCount: z.number().int().nonnegative(),
  openInquiryCount: z.number().int().nonnegative(),
  needsReplyCount: z.number().int().nonnegative(),
  pendingProofCount: z.number().int().nonnegative(),
  attentionDues: z.array(landlordDueSummarySchema),
});

export const recordManualPaymentSchema = z.object({
  amount: z.number().positive(),
  method: paymentMethodSchema,
  receivedAt: z.string().datetime(),
});
```

- [ ] **Step 2: Write failing aggregate and invariant tests**

```ts
it('calculates the portfolio only from the owning landlord records', async () => {
  const response = await landlordRequest({ method: 'GET', url: '/v1/landlord/overview' });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    expectedThisMonth: 36000,
    collectedThisMonth: 18000,
    pendingProofCount: 1,
  });
});

it('prevents making an actively tenanted unit available', async () => {
  const response = await landlordRequest({
    method: 'POST',
    url: `/v1/landlord/units/${occupiedUnitId}/status`,
    payload: { status: 'available' },
  });
  expect(response.statusCode).toBe(409);
  expect(response.json().code).toBe('ACTIVE_TENANCY_CONFLICT');
});

it('rejects a manual payment larger than the locked balance', async () => {
  const response = await landlordRequest({
    method: 'POST',
    url: `/v1/landlord/dues/${dueId}/payments`,
    payload: { amount: 20000, method: 'cash', receivedAt: now },
  });
  expect(response.statusCode).toBe(422);
  expect(response.json().code).toBe('PAYMENT_EXCEEDS_BALANCE');
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/landlord-operations.test.ts
npm run db:test
```

Expected: FAIL because scoped aggregates and guarded mutation RPCs do not exist.

- [ ] **Step 4: Create scoped operation functions**

Create `landlord_portfolio_summary(as_of date)` that derives monthly expected rent from dues, collected rent from payments, overdue counts/balances from due dates and payment sums, occupancy from current unit states, inquiry workload from thread activity, and pending proof count from submitted proofs. Every relation is filtered by `landlord_id = auth.uid()` before aggregation.

Create `change_unit_status(unit_id, status)` that locks the owned unit, rejects `available` when a pending/active tenancy exists, updates the unit, and appends an audit event.

Create `end_tenancy(tenancy_id, ended_on)` that locks an owned pending/active tenancy, requires `ended_on` between its start date and the current date, marks it ended, releases the unit only when no other pending/active tenancy reserves it, preserves all billing history, and appends an audit event.

Create `record_manual_payment(due_id, amount, method, received_at)` that locks the owned due, calculates current balance, requires `0 < amount <= balance`, inserts the payment, rejects any still-submitted proof with the approved system reason when the balance reaches zero, and appends an audit event.

```sql
create unique index payment_idempotency
on public.payments(recorded_by, due_id, idempotency_key);
```

Add a non-null `idempotency_key uuid` column to payments before creating this index. Replaying the same key returns the original payment rather than adding a second row.

- [ ] **Step 5: Implement focused landlord read endpoints**

Do not reproduce the prototype's “fetch every table then join in the browser” pattern. Expose one endpoint per page/use case with server-side filtering, sorting, explicit result counts, and bounded page sizes. Use `limit=25` by default and a stable cursor for lists.

```ts
app.get('/v1/landlord/overview', { preHandler: requireRole('landlord') }, async (request) =>
  portfolioSummarySchema.parse(await service.overview(request.actor, clock.today())));
app.post('/v1/landlord/units/:unitId/status', {
  preHandler: requireRole('landlord'),
}, async (request) =>
  service.changeUnitStatus(request.actor, unitParams.parse(request.params).unitId,
    unitStatusInputSchema.parse(request.body), request.idempotencyKey));
```

- [ ] **Step 6: Replace client-side scoping and joins**

Refactor `usePortfolioSummary` to call `GET /landlord/overview`. Refactor Properties, Tenants, Payments, and their detail pages to use their focused endpoints. Remove `DEMO_LANDLORD_ID`, client-side owner filtering, and broad `listTenancies/listDues/listPayments` production calls. Add a named confirmation on tenant detail for ending a tenancy; after success, keep the ended record visible and explain whether the unit became available.

Keep the existing responsive table/card presentation and status components. Add pending proof count to the dashboard and Payments page. Update unit status and manual-payment mutations to use idempotency keys, invalidate only affected summary/detail queries, and preserve review dialogs.

- [ ] **Step 7: Add operation integration and end-to-end coverage**

```tsx
it('records a partial landlord-confirmed payment and refreshes summary and detail', async () => {
  renderApp({ route: '/landlord/tenants/tenancy-1', auth: landlord });
  await userEvent.click(await screen.findByRole('button', { name: 'Record payment' }));
  await userEvent.clear(screen.getByLabelText('Amount received'));
  await userEvent.type(screen.getByLabelText('Amount received'), '9000');
  await userEvent.click(screen.getByRole('button', { name: 'Review payment' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm payment record' }));
  expect(await screen.findByText('Payment recorded')).toBeVisible();
  expect(screen.getByRole('group', { name: 'Outstanding balance' })).toHaveTextContent('₱9,000');
});
```

Run existing landlord browser journeys against API data. Add a second landlord and assert every list, detail, aggregate, unit mutation, tenancy-ending action, and payment mutation excludes or rejects the other landlord's records. Verify that ending the tenancy resolves the existing active-tenancy conflict before making the unit available.

- [ ] **Step 8: Run the landlord operations gate**

Run:

```bash
npm run db:reset
npm run db:test
npm run test:run -w @rentdito/api -- test/landlord-operations.test.ts
npm run test:run -w @rentdito/frontend -- src/pages/landlord/properties.test.tsx src/pages/landlord/operations.test.tsx src/pages/landlord/payment-review.test.tsx
npm run e2e -w @rentdito/frontend -- e2e/landlord.spec.ts e2e/payment-proof-review.spec.ts
npm run typecheck
npm run lint
npm run build
```

Expected: source-derived KPIs, pagination, owner scoping, unit conflicts, partial payments, proof conflicts, and all existing landlord journeys pass.

- [ ] **Step 9: Release landlord operations**

Deploy migration/API/frontend with `landlord_operations=false`. Compare each staging KPI to direct scoped SQL, record a partial and final manual payment, test an occupied-unit conflict, verify the audit events, then enable the feature.

- [ ] **Step 10: Commit landlord operations**

```bash
git add packages/contracts supabase api/src/modules/landlordOperations api/test/landlord-operations.test.ts frontend/src/shared/api frontend/src/features/portfolio frontend/src/features/unit-status frontend/src/features/payment/RecordPaymentForm.tsx frontend/src/pages/landlord frontend/e2e/landlord.spec.ts
git commit -m "feat: connect landlord operations"
```

---

### Task 10: Harden and Launch the Production MVP

**Feature release:** Production PWA, accessibility, security, operations, and go-live.

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/index.html`
- Modify: `frontend/vercel.json`
- Modify: `frontend/src/pages/OfflinePage.tsx`
- Modify: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/app/repositories.ts`
- Remove from production imports: `frontend/src/app/demo/*`
- Move to test fixtures or remove: `frontend/src/shared/api/mock/*`
- Remove: `frontend/src/features/demo-session/*`
- Modify: `frontend/e2e/responsive-a11y.spec.ts`
- Create: `frontend/e2e/security-boundaries.spec.ts`
- Create: `api/test/security.test.ts`
- Modify: `api/src/app.ts`
- Modify: `api/src/plugins/errors.ts`
- Create: `api/src/jobs/cleanupUploads.ts`
- Create: `api/test/cleanup-uploads.test.ts`
- Modify: `render.yaml`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/operations/deployment.md`
- Create: `docs/operations/admin-accounts.md`
- Create: `docs/operations/backup-restore.md`
- Create: `docs/operations/incident-response.md`
- Create: `docs/operations/release-checklist.md`
- Create: `README.md`

**Interfaces:**
- Produces: production-only `HttpRentDitoRepository`
- Produces: safe offline read behavior with no mutation queue
- Produces: daily `cleanupUploads` Render cron
- Consumes: all prior feature contracts and release gates

- [ ] **Step 1: Write failing production-safety tests**

```ts
it('never exposes secrets or private URLs in API logs', async () => {
  await authenticatedRequest({
    method: 'POST',
    url: '/v1/tenant/dues/due-1/proofs',
    headers: { authorization: 'Bearer secret-access-token' },
    payload: validProof,
  });
  const output = capturedLogs.join('\n');
  expect(output).not.toContain('secret-access-token');
  expect(output).not.toContain('signedUrl');
  expect(output).not.toContain('storage_path');
});

it('returns one safe problem shape for unknown protected records', async () => {
  const response = await tenantRequest({
    method: 'GET',
    url: '/v1/tenant/payment-proofs/00000000-0000-4000-8000-000000000000',
  });
  expect(response.statusCode).toBe(404);
  expect(apiProblemSchema.parse(response.json()).code).toBe('PAYMENT_PROOF_NOT_FOUND');
});
```

Add a production-build browser assertion that demo role switcher, “prototype,” “simulated payment,” and “reset demo data” are absent from every route.

- [ ] **Step 2: Run focused hardening tests and confirm the red state**

Run:

```bash
npm run test:run -w @rentdito/api -- test/security.test.ts test/cleanup-uploads.test.ts
npm run e2e -w @rentdito/frontend -- e2e/security-boundaries.spec.ts e2e/responsive-a11y.spec.ts
```

Expected: FAIL until redaction, cleanup, production composition, and updated browser assertions exist.

- [ ] **Step 3: Lock down API transport and responses**

Register Fastify Helmet, strict CORS with exact environment origins, request-size limits, endpoint-specific rate limits, request IDs, and a central error handler. Reject unknown JSON fields through strict Zod objects. Never return raw Supabase errors.

```ts
await app.register(cors, {
  origin: env.WEB_ORIGINS,
  credentials: false,
  allowedHeaders: ['authorization', 'content-type', 'idempotency-key'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
});
```

The Vercel frontend CSP permits scripts/styles from self, fonts/images from self and the configured Supabase project, and connections only to the configured Render API and Supabase Auth/Storage. Do not use `unsafe-eval`; retain only the minimum style exception required by the current build and remove it if the production build passes without it.

- [ ] **Step 4: Make PWA and offline behavior truthful**

Update the manifest description to remove “prototype.” Cache only versioned application shell/static assets. Use network-only handling for all `/v1/` API traffic and private signed Storage URLs. Do not use background sync for inquiries, invitations, listing changes, or payment proofs. Previously rendered data may remain on screen with an offline banner, but mutations are disabled and explain that reconnection is required.

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
  navigateFallback: 'index.html',
  cleanupOutdatedCaches: true,
  runtimeCaching: [{
    urlPattern: ({ url }) => url.pathname.startsWith('/v1/'),
    handler: 'NetworkOnly',
    method: 'GET',
  }],
}
```

- [ ] **Step 5: Remove production demo paths**

Production `repositories.ts` always constructs the HTTP adapter. Move mock repository and seed data under `frontend/src/test/fixtures` if unit tests still need them. Remove DemoSessionProvider, DemoRoleSwitcher, ResetDemoDataButton, prototype banners, simulated failure controls, fictional profiles, and local demo persistence from runtime imports. Verify the production bundle has no `rentdito:demo-data` string.

- [ ] **Step 6: Implement abandoned-upload cleanup**

`cleanupUploads.ts` lists upload-intent records older than 24 hours with no attached property media or proof, removes the private object, then marks the intent cleaned. It is idempotent: missing objects count as already clean and attached objects are never selected.

```yaml
  - type: cron
    name: rentdito-cleanup-uploads
    runtime: node
    schedule: "35 16 * * *"
    rootDir: .
    buildCommand: npm ci && npm run build -w @rentdito/contracts && npm run build -w @rentdito/api
    startCommand: npm run job:cleanup-uploads -w @rentdito/api
```

Add a test with one abandoned, one attached, and one recent upload; only the abandoned object and intent are cleaned.

- [ ] **Step 7: Complete accessibility and responsive verification**

For `/`, listing detail, sign-in/register, listing authoring, admin review, invitation acceptance, landlord overview/property/tenant/payment review, tenant overview/rental/dues/proof status, settings, offline, and not-found routes:

- Run axe and fail on serious or critical violations.
- Verify one H1, logical headings, labeled form fields, visible focus, dialog focus return, and screen-reader mutation announcements.
- Test 390x844, 768x1024, and 1440x900.
- Assert no horizontal document overflow.
- Assert primary touch targets are at least 44x44 CSS pixels.
- Assert sticky actions do not cover the final focusable element.
- Verify `prefers-reduced-motion` disables nonessential transitions.

- [ ] **Step 8: Add operations documentation with executable commands**

`deployment.md` documents migration -> Render -> Vercel -> smoke -> feature-enable order and rollback. `admin-accounts.md` documents the server-only admin provision/reset commands and their audit events. `backup-restore.md` records how to trigger a Supabase backup, restore into an isolated project, point a temporary Render service to it, and verify row counts without exposing data. `incident-response.md` defines credential rotation and feature-disable order. `release-checklist.md` contains the exact final commands below and named user journeys.

- [ ] **Step 9: Run the complete local and CI-equivalent gate**

Run:

```bash
npm ci
npx supabase start
npm run db:reset
npm run db:lint
npm run db:test
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

Expected: every command exits 0; every pgTAP assertion passes; all desktop/mobile projects pass; the production bundle contains no demo persistence or simulated-payment UI.

- [ ] **Step 10: Perform staging security and recovery rehearsal**

Use four staging accounts: tenant A, tenant B, landlord A, landlord B, plus the provisioned admin. Attempt guessed IDs and copied signed URLs across every pair. Confirm denied access, five-minute receipt URL expiration, rate-limit responses, invitation expiration/reuse, and duplicate approval behavior. Trigger both cron jobs twice. Restore a staging backup into an isolated Supabase project and run read-only row-count and login smoke checks.

- [ ] **Step 11: Run the production release sequence**

Apply all reviewed migrations to production. Deploy Render and require a healthy `/healthz`. Deploy Vercel with all new feature flags disabled. Run read-only public and authenticated smoke tests. Enable features in dependency order:

```text
accounts
marketplace
listing_authoring
listing_moderation
saved_inquiries
tenancy_invitations
tenant_billing
payment_proofs
landlord_operations
```

After each enablement, run its documented primary journey and inspect logs/audit events. Stop enablement and roll back API/frontend on any failed gate; do not roll back additive compatible migrations during the incident.

- [ ] **Step 12: Commit production hardening**

```bash
git add frontend api render.yaml .github docs/operations README.md
git commit -m "chore: harden RentDito for MVP launch"
```

---

## Slice Dependency and Shipping Rules

```text
0 Foundation
└── 1 Accounts
    ├── 2 Public marketplace
    │   ├── 3 Listing authoring
    │   │   └── 4 Admin moderation
    │   └── 5 Saves and inquiries
    └── 6 Tenancy invitations
        └── 7 Tenant rental and dues
            └── 8 Payment proofs
                └── 9 Landlord operations
                    └── 10 Production hardening
```

One slice is complete only when:

1. Its migration is repeatable from an empty local database.
2. Its RLS tests include an allowed owner/participant and a denied stranger.
3. Its API integration tests pass against local Supabase.
4. Its frontend test covers loading, empty, validation, success, and recoverable error states.
5. Its desktop and mobile primary journey passes in Playwright.
6. Type checking, linting, all tests, and production builds pass.
7. The slice is deployed disabled, smoke-tested in staging, then enabled.
8. Its commit contains no secrets, production identifiers, demo-only runtime behavior, or unrelated refactors.

## Program Definition of Done

- All routes in the existing prototype are backed by authenticated production data where required.
- Landlords can create listings; admins must approve them before public discovery.
- Tenant inquiries and landlord replies persist and remain participant-scoped.
- One-time tenancy invitations are expiring, revocable, single-use, and atomic.
- Monthly dues generate once per tenancy and billing period.
- A receipt upload leaves the balance unchanged until the owning landlord approves it.
- Approval creates exactly one full payment; rejection leaves the balance unchanged and permits resubmission.
- Landlord manual payment records support partial amounts without overpayment or duplicate retry.
- Portfolio figures derive from authoritative scoped records.
- Private listing drafts and receipts cannot be fetched with guessed identifiers or unrelated sessions.
- Vercel, Render, and Supabase use separate staging/production configuration with no secrets in frontend builds.
- Production contains no role switcher, reset-demo action, mock persistence, fake checkout, financial credential fields, or prototype copy.
- CI, accessibility, responsive, security-boundary, backup/restore, and release smoke gates pass.
