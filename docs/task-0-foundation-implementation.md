# Task 0: Deployable Platform Foundation

**Document status:** Implementation handoff

**Last updated:** 2026-09-10

**Implementation branch:** `feat/task-0-foundation`

**Implementation commit:** `4ae93e3 build: establish production platform foundation`

## 1. Status

Task 0's code implementation is complete and committed. Its external release
acceptance is still pending because the foundation has not yet been deployed to
the staging Supabase, Render, and Vercel projects.

| Area | Status | Evidence or remaining action |
| --- | --- | --- |
| npm workspace and Node pin | Complete | Root workspace, root lockfile, and Node `24.14.1` are committed. |
| Shared contracts | Complete | Feature-key, feature-response, and API-problem schemas are exported by `@rentdito/contracts`. |
| Fastify API foundation | Complete | Environment parsing, readiness endpoint, feature endpoint, and idempotency primitive are implemented. |
| Supabase foundation | Complete locally | Migration resets cleanly; database lint and 10 pgTAP assertions passed. |
| Vercel configuration | Complete in code | SPA rewrite and baseline response headers are committed. |
| Render configuration | Complete in code | API blueprint, health check, required variables, and disabled flags are committed. |
| CI | Complete in code | Database, type, lint, unit, build, and browser gates run on pull requests and pushes to `main`. |
| Local verification | Complete | The complete foundation gate passed on 2026-09-10. |
| Staging deployment and smoke test | Pending | Provision separate staging services, deploy, and verify the two public metadata endpoints. |
| Production deployment | Not started | Production remains intentionally untouched until staging acceptance. |

Task 0 is a delivery foundation. It intentionally enables no production product
behavior.

## 2. Scope and non-scope

Task 0 provides:

- A single npm workspace for the frontend, API, and shared contracts.
- A Node/TypeScript Fastify service deployable to Render.
- A local and hosted Supabase migration workflow.
- Private Storage bucket definitions for future listing photos and receipt images.
- Health and feature-discovery endpoints.
- A reusable idempotency primitive for future mutating API routes.
- Vercel, Render, and GitHub Actions configuration.
- Default-off feature flags for every planned MVP slice.

Task 0 does **not** provide:

- Username/password accounts, sessions, or role authorization.
- Landlord listing creation or administrator moderation.
- Tenancy invitations.
- Tenant dues or receipt-image submission.
- Landlord receipt approval or payment settlement.
- A frontend HTTP repository; the current UI remains backed by demo/mock data.
- A database-backed implementation of the idempotency store.
- Scheduled billing or cleanup jobs. Their package scripts are reserved for later tasks.
- Final API CORS, Helmet, rate limiting, or centralized error handling. Those are
  introduced with the feature slices and production-hardening task.

## 3. Runtime architecture

```text
Browser
  |
  | HTTPS
  v
Vercel: React/Vite frontend
  |
  | VITE_API_BASE_URL (used by a later HTTP repository task)
  v
Render: Fastify API
  |
  | server-only Supabase credentials
  v
Supabase
  |- Auth       (configured locally; account behavior begins in Task 1)
  |- Postgres   (foundation tables and future feature data)
  `- Storage    (private listing-media and payment-proofs buckets)
```

Dependency direction is deliberately one-way:

```text
frontend -----> @rentdito/contracts <----- api
                                         |
                                         v
                                      Supabase
```

The frontend and API do not import one another. Public request/response schemas
belong in `packages/contracts`; database-generated types remain private to the API.

## 4. Repository layout introduced by Task 0

```text
/
|- package.json                         Root workspace scripts
|- package-lock.json                    One dependency lockfile
|- .node-version                        Node 24.14.1
|- .env.example                         Combined local variable reference
|- render.yaml                          Render API blueprint
|- .github/workflows/ci.yml             CI verification pipeline
|- packages/contracts/
|  `- src/common.ts                     Shared platform schemas
|- api/
|  |- .env.example                      API variable template
|  |- src/app.ts                        Testable Fastify composition
|  |- src/server.ts                     Render/local process entry point
|  |- src/env.ts                        Strict environment parsing
|  |- src/modules/meta/routes.ts        Health and feature endpoints
|  |- src/plugins/idempotency.ts        Reusable idempotency runner
|  `- src/generated/database.types.ts   Generated Supabase types
|- supabase/
|  |- config.toml                       Local Supabase configuration
|  |- migrations/202609090001_foundation.sql
|  `- tests/database/001_foundation.test.sql
`- frontend/
   |- .env.example                      Public API URL template
   `- vercel.json                       SPA and baseline headers
```

## 5. Workspace and build conventions

The root workspace owns dependency installation and the only lockfile. Run npm
commands from the repository root unless a command says otherwise.

| Workspace | Package name | Purpose |
| --- | --- | --- |
| `frontend` | `@rentdito/frontend` | React/Vite application deployed to Vercel |
| `api` | `@rentdito/api` | Fastify API deployed to Render |
| `packages/contracts` | `@rentdito/contracts` | Zod schemas and shared TypeScript types |

Node must satisfy `>=24.0.0 <25`; CI and Render use the exact `.node-version`
value, `24.14.1`.

Root commands:

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproduce the committed dependency graph. |
| `npm run build` | Build contracts, API, then frontend. |
| `npm run typecheck` | Type-check every workspace that defines the script. |
| `npm run lint` | Lint every workspace that defines the script. |
| `npm test` | Run all Vitest suites once. |
| `npm run db:start` | Start the local Supabase stack. |
| `npm run db:reset` | Rebuild the local database from migrations and seed. |
| `npm run db:lint` | Fail on database lint errors. |
| `npm run db:test` | Run local pgTAP tests. |
| `npm run e2e` | Build the frontend and run desktop/mobile Playwright journeys. |

## 6. Shared platform contracts

`@rentdito/contracts` defines the stable platform vocabulary used by later
frontend and API slices.

### Feature keys

Every feature is represented by one of these keys:

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

### API problem shape

Later API error handlers must return this contract instead of exposing raw
database or framework errors:

```json
{
  "code": "STABLE_MACHINE_CODE",
  "message": "Safe user-facing explanation",
  "requestId": "request-correlation-id",
  "fields": {
    "optionalFieldName": "Optional validation explanation"
  }
}
```

The schema exists in Task 0; centralized error serialization is implemented in a
later slice.

## 7. API behavior

### `GET /healthz`

The server probes Postgres by issuing a head-only query against
`public.audit_events` through the server-only Supabase client.

Healthy response:

```http
HTTP/1.1 200 OK
```

```json
{ "status": "ok", "database": "ok" }
```

Unavailable database response:

```http
HTTP/1.1 503 Service Unavailable
```

```json
{ "status": "unavailable", "database": "unavailable" }
```

Render uses this endpoint as `healthCheckPath`, so an API instance is not healthy
unless it can reach its configured Supabase database.

### `GET /v1/meta/features`

The response always contains all nine feature keys. Missing environment flags
default to `false`.

```json
{
  "features": {
    "accounts": false,
    "marketplace": false,
    "listing_authoring": false,
    "listing_moderation": false,
    "saved_inquiries": false,
    "tenancy_invitations": false,
    "tenant_billing": false,
    "payment_proofs": false,
    "landlord_operations": false
  }
}
```

In Task 0 this endpoint reports configuration only. There are no product API
routes to gate yet.

### Idempotency primitive

`createIdempotencyRunner(store)` establishes the behavior later mutation routes
will use:

- A new `(actorId, key)` claim runs the work once and stores its response.
- A matching retry returns the stored response without rerunning the work.
- Reusing the key for a different operation or payload hash produces
  `409 IDEMPOTENCY_KEY_REUSED`.
- A retry while the first request is unfinished produces
  `409 IDEMPOTENCY_REQUEST_IN_PROGRESS`.
- Failed work releases its claim so a safe retry can run.

The runner depends on an `IdempotencyStore` interface. Task 0 tests it with an
in-memory store; a Supabase-backed adapter is intentionally deferred until a
mutating feature route needs it.

## 8. Environment configuration

The API validates its complete environment at startup. Invalid URLs, origins,
ports, or non-boolean feature values stop the process immediately.

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | No | Defaults to `development`; accepts `development`, `test`, or `production`. |
| `PORT` | No | No | Defaults to `4000`; must be from 1 through 65535. |
| `SUPABASE_URL` | Yes | No | Staging and production must point to different projects. |
| `SUPABASE_ANON_KEY` | Yes | Treat as configuration | Required for future user-scoped clients; not currently used by `server.ts`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Yes** | Render only. Never expose it to Vercel, browser code, logs, or commits. |
| `WEB_ORIGINS` | Yes | No | Comma-separated origins with no path, query, or fragment. |
| `FEATURE_*` | No | No | Exact lowercase `true` or `false`; every flag defaults to `false`. |
| `VITE_API_BASE_URL` | Frontend deployment | No | Public Render API origin. All `VITE_` values are browser-visible. |

The checked-in `.env.example` files contain placeholders only. Task 0 does not
load `.env` files automatically; provide API variables through the process
environment locally and through Render environment variables when hosted.

## 9. Supabase foundation

Local Supabase uses project ID `rentdito` and these primary ports:

| Service | Local address |
| --- | --- |
| API/Auth/Storage gateway | `http://127.0.0.1:55321` |
| Postgres | `127.0.0.1:55322` |
| Studio | `http://127.0.0.1:55323` |

### Database objects

| Object | Purpose | Access boundary |
| --- | --- | --- |
| `public.audit_events` | Foundation storage for privileged activity records | RLS enabled; all direct `anon` and `authenticated` table privileges revoked |
| `public.idempotency_records` | Durable mutation result/retry records | RLS enabled; direct client privileges revoked; indexed by creation time |
| `public.upload_intents` | Metadata for authorized direct uploads and cleanup | RLS enabled; direct client privileges revoked; indexed for pending cleanup |
| `public.set_updated_at()` | Trigger helper for future tables | Execution revoked from `public`, `anon`, and `authenticated` |

Task 0 intentionally does not add permissive RLS policies. These privileged
objects are server-owned and therefore inaccessible to direct browser clients.

### Private Storage buckets

| Bucket | Public | Size limit | MIME types |
| --- | --- | --- | --- |
| `listing-media` | No | 10 MiB | JPEG, PNG, WebP |
| `payment-proofs` | No | 5 MiB | JPEG, PNG, WebP |

The global local Storage limit is not the security boundary; each bucket's
smaller limit is stored in the database migration. Object upload/read policies
and signed-URL authorization are added with their owning feature slices.

### Generated database types

After every schema-changing migration, reset the local database and regenerate:

```bash
npm run db:reset
npx supabase gen types --lang=typescript --local > api/src/generated/database.types.ts
```

Commit the migration, pgTAP coverage, and regenerated type file together.

## 10. Local development runbook

Prerequisites:

- Node `24.14.1`
- Docker Desktop or another Docker-compatible runtime
- Git

Install and prepare the database from the repository root:

```bash
npm ci
npx supabase start
npm run db:reset
npm run db:lint
npm run db:test
npx supabase status
```

Copy the local API URL, anonymous key, and service-role key printed by Supabase
into process environment variables. Example for PowerShell:

```powershell
$env:NODE_ENV = 'development'
$env:PORT = '4000'
$env:SUPABASE_URL = 'http://127.0.0.1:55321'
$env:SUPABASE_ANON_KEY = '<local-anon-key>'
$env:SUPABASE_SERVICE_ROLE_KEY = '<local-service-role-key>'
$env:WEB_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
npm run dev -w @rentdito/api
```

Keep all feature flags unset, or set them explicitly to `false`.

In another terminal, start the frontend:

```powershell
$env:VITE_API_BASE_URL = 'http://localhost:4000'
npm run dev -w @rentdito/frontend
```

The frontend variable is prepared for the future HTTP adapter; the Task 0 UI
still uses its mock repository.

Smoke-test the API:

```powershell
Invoke-RestMethod 'http://localhost:4000/healthz'
Invoke-RestMethod 'http://localhost:4000/v1/meta/features'
```

Stop the local stack when finished:

```bash
npx supabase stop
```

## 11. Verification and CI

The local CI-equivalent gate is:

```bash
npm ci
npx supabase start
npm run db:reset
npm run db:lint
npm run db:test
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
```

Most recent Task 0 verification on 2026-09-10:

| Gate | Result |
| --- | --- |
| Clean install | Passed |
| Supabase start/reset | Passed |
| Database lint | Passed |
| Database tests | 1 test file, 10 pgTAP assertions passed |
| TypeScript checks | Passed |
| ESLint | Passed |
| Vitest | 14 files, 73 tests passed: frontend 11/63 and API 3/10 |
| Production build | Passed |
| Playwright | 51 passed, 1 skipped across desktop and mobile projects |

For a machine with a compatible installed Chromium browser, Playwright also
supports:

```powershell
$env:PLAYWRIGHT_EXECUTABLE_PATH = '<absolute-path-to-browser-executable>'
npm run e2e
```

GitHub Actions reproduces the same database, type, lint, test, build, and browser
sequence for every pull request and push to `main`. It always stops local
Supabase, even when a previous step fails.

## 12. Staging deployment runbook

Use distinct staging and production Supabase projects. Never reuse credentials
between environments and never commit project references, deployment URLs, or
secrets.

### 12.1 Supabase staging

1. Create the RentDito staging project in Supabase.
2. Link the CLI to its project reference.
3. review the pending migration, then apply it.
4. Confirm that the three tables and two private buckets exist.

```bash
npx supabase link --project-ref <staging-project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Record these values for Render without placing them in a tracked file:

- Project URL
- Anonymous key
- Service-role key

### 12.2 Render staging

Create the service from `render.yaml`, then configure:

```text
SUPABASE_URL=<staging-project-url>
SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
WEB_ORIGINS=<exact-staging-vercel-origin>
```

Confirm that Render uses Node `24.14.1`, runs the blueprint build/start commands,
and reports `/healthz` as healthy. Leave every `FEATURE_*` variable `false`.

### 12.3 Vercel staging

Import the repository into Vercel and configure the frontend project with:

- Root directory: `frontend`
- Node.js major: `24.x`
- `VITE_API_BASE_URL`: exact HTTPS origin of the staging Render API

The committed `frontend/vercel.json` sends all routes to `index.html` for the SPA
and adds `X-Content-Type-Options` and `Referrer-Policy` headers.

### 12.4 Staging smoke test

Set a temporary shell variable; do not save the URL in the repository.

```powershell
$env:RENDITO_STAGING_API_URL = 'https://<render-staging-host>'
Invoke-RestMethod "$env:RENDITO_STAGING_API_URL/healthz"
Invoke-RestMethod "$env:RENDITO_STAGING_API_URL/v1/meta/features"
```

Acceptance criteria:

- `/healthz` returns HTTP 200 with `{ "status": "ok", "database": "ok" }`.
- `/v1/meta/features` returns all nine feature keys as `false`.
- Render's health indicator remains healthy after deployment.
- The Vercel SPA loads directly on a nested route without returning 404.
- Browser-visible configuration contains no Supabase service-role key.
- Staging uses no production credentials or project identifiers.

Only after these checks pass should Task 0 be marked fully released.

## 13. Production promotion and rollback

Production promotion follows this order:

```text
Supabase additive migration -> Render API -> API smoke test -> Vercel frontend
```

Keep every product feature disabled during the foundation release.

If the Render deployment is unhealthy:

1. Leave every feature flag `false`.
2. Roll Render back to its last healthy deployment.
3. Verify the configured Supabase URL and credentials.
4. Do not destructively reverse the additive foundation migration during an
   application incident.

If the Vercel deployment fails, promote the previous Vercel deployment and leave
the healthy API in place. If a credential may have been exposed, rotate it in
Supabase and update Render before restoring traffic.

## 14. Security decisions established by Task 0

- The Supabase service-role key is server-only.
- Authorization headers are redacted from Fastify logs.
- Foundation tables use RLS and deny direct anonymous/authenticated access.
- Both Storage buckets are private and restrict image types and object sizes.
- Feature releases default to disabled.
- Environment parsing fails closed on malformed configuration.
- CI uses local Supabase rather than hosted production credentials.
- Database changes are additive and are deployed before dependent API/frontend code.
- Secrets are supplied through process/hosting environments rather than tracked
  files; Supabase temporary state, build outputs, and dependencies are excluded
  from Git.

These controls establish a baseline; they do not replace feature-specific RLS,
authenticated API authorization, signed URLs, content validation, rate limits,
or final security headers.

The repository does not currently define a general `.env` ignore rule. Do not
create credential-bearing `.env` files until an explicit ignore convention is
added and verified; the Task 0 local runbook above uses process variables.

## 15. Handoff to Task 1

Task 1 can begin from this foundation by adding username/password accounts and
permanently fixed tenant/landlord roles, with administrators privately
provisioned. It must preserve these Task 0 invariants:

- Shared API schemas remain in `@rentdito/contracts`.
- Server secrets never enter the frontend build.
- New tables receive explicit grants, RLS, and pgTAP coverage.
- Schema changes regenerate `api/src/generated/database.types.ts`.
- New behavior deploys disabled and is accepted in staging before enablement.
- Existing health and feature metadata contracts remain backward-compatible.

Before Task 1 is released, finish the pending Task 0 staging deployment and smoke
test described in section 12.

## 16. Source documents

- Product and production architecture:
  `docs/superpowers/specs/2026-09-09-rentdito-mvp-production-architecture-design.md`
- Feature-by-feature implementation plan:
  `docs/superpowers/plans/2026-09-09-rentdito-production-mvp-feature-rollout.md`
- Task 0 foundation migration:
  `supabase/migrations/202609090001_foundation.sql`
- Task 0 database acceptance tests:
  `supabase/tests/database/001_foundation.test.sql`
