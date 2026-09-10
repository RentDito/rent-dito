# Task 1: Username/Password Accounts and Fixed Roles

**Document status:** Running implementation record — Task 1 is in progress.

**Last updated:** 2026-09-10

**Working branch:** `fix/task-0-audit-remediation` (Task 0 remediation plus
Task 1 Step 1; not yet merged to `main`)

**Authoritative plan:** section "Task 1" in
`docs/superpowers/plans/2026-09-09-rentdito-production-mvp-feature-rollout.md`.
That plan is the specification. This document records what has actually been
done against it, and why, so the next implementer does not redo or contradict
finished work.

## 1. Status at a glance

| Step | Description | Status |
| --- | --- | --- |
| 1 | Define the shared account contract | **Done** — committed `eb064ab` |
| 2 | Write failing API and database authorization tests | Not started |
| 3 | Run the tests and confirm the red state | Not started |
| 4 | Create account tables, immutable-role enforcement, and RLS | Not started |
| 5 | Implement secure account orchestration | Not started |
| 6 | Replace demo sessions with the production Auth provider | Not started |
| 7 | Add frontend and browser account tests | Not started |
| 8 | Run the account feature gate | Not started |
| 9 | Release accounts | **Blocked** — see section 6 |
| 10 | Commit accounts | Not started |

Nothing in Task 1 is user-visible yet. `FEATURE_ACCOUNTS` remains `false`
everywhere, and no account route exists.

## 2. What Step 1 delivered

Files added or changed:

| File | Change |
| --- | --- |
| `packages/contracts/src/auth.ts` | New. Role, username, password, phone, registration, login, profile, and session schemas. |
| `packages/contracts/src/index.ts` | Re-exports every auth schema and type. |
| `packages/contracts/test/auth.test.ts` | New. 24 tests. |

The contracts workspace now runs 31 tests across 2 files (7 in
`contracts.test.ts` from Task 0, 24 in `auth.test.ts`).

### Two deliberate departures from the plan's code sketch

Both are security-motivated. Do not "correct" them back without reading this.

**1. `publicRegistrationRoleSchema` is a separate, narrower enum.**

The plan's Step 4 note says the registration endpoint "must reject `admin`
before calling the Auth admin API". Rather than leaving that as a runtime check
somebody can forget, `registerRequestSchema` uses a role enum containing only
`tenant` and `landlord`. An `admin` registration payload is therefore
unrepresentable — it fails at the schema boundary and is a type error in
TypeScript, not a check that has to be remembered.

`appRoleSchema` still carries all three roles, because profiles, sessions, and
`requireRole` all need the full set.

**2. `loginRequestSchema` does not reuse `passwordSchema`.**

Login accepts `z.string().min(1).max(128)` rather than the 12-character policy.
This looks like an inconsistency and is not one:

- Applying the policy at login would tell an attacker the minimum length
  without them holding an account.
- Every failed login must be indistinguishable. A password rejected for being
  short would return a different shape from one rejected for being wrong,
  which is exactly the disclosure the plan's `INVALID_CREDENTIALS` requirement
  exists to prevent.

The reasoning is also comments in `auth.ts` beside each schema.

### Smaller choices

- `z.uuid()` is used rather than the plan sketch's deprecated
  `z.string().uuid()`, matching how `common.ts` already uses `z.url()` under
  zod 4.
- `phoneSchema` and `accountStatusSchema` were extracted as named exports. The
  plan inlined them; Step 4's `profiles` table and Step 6's settings form both
  need them by name.
- **Test passwords must not look like real passphrases.** The plan's example
  tests pair a realistic username with a realistic passphrase literal. Copying
  that pair verbatim triggered GitGuardian's "Username Password" detector on
  PR #1 and blocked the merge. Later steps (`api/test/auth.test.ts`, the
  frontend auth tests, and `e2e/auth.spec.ts`) should build the fixture from an
  obviously synthetic literal such as `'x'.repeat(16)` — see
  `VALID_TEST_PASSWORD` in `packages/contracts/test/auth.test.ts`. Suppressing
  the scanner instead teaches the team to dismiss its warnings, and the next
  one may be real.
- Username length is validated **after** trimming. `usernameSchema.parse('  a  ')`
  fails rather than passing a 5-character string. There is a test asserting
  this specifically, because the opposite behaviour would be a silent
  data-quality bug.

## 3. Foundation invariants this task must preserve

Task 0 established these. Section 15 of
`docs/task-0-foundation-implementation.md` is the full list; these are the ones
Task 1 is most likely to trip over.

**Contracts are built, not just type-checked.** `@rentdito/contracts` resolves
types from `src` but its runtime import from `dist`. Anything that executes
contracts code needs `dist` to exist. Two mechanisms keep that true — a
`prepare` script on the contracts package, and the root `npm test` building
contracts before any suite runs. **Do not remove either.** Without them the
first value import of an auth schema fails at runtime with `Failed to resolve
entry for package "@rentdito/contracts"` while type-checking still passes.

**Tests are type-checked.** Every workspace has a `tsconfig.json` covering
`src` **and** `test`, plus a `tsconfig.build.json` that emits only `src`. New
test files are type-checked; a type error in a test fails CI.

**New workspaces need a lint config and a test script**, or the root gates skip
them silently with `--if-present`.

**Routes serialise through their contract.** `/v1/meta/features` parses its
response through `featureResponseSchema` rather than hand-building a matching
object. Auth routes should follow this — return
`sessionResponseSchema.parse(...)`, so a schema change that the handler misses
fails loudly instead of shipping a wrong shape.

**Migrations are additive, and every new table needs explicit grants, RLS, and
pgTAP coverage.** Regenerate `api/src/generated/database.types.ts` after any
schema change and commit it with the migration.

## 4. Groundwork already in place for later steps

Some Task 1 prerequisites were completed during Task 0 or its audit
remediation. Check here before adding them again.

| Need | State |
| --- | --- |
| CORS for browser calls to the API | **Done.** `@fastify/cors` is registered in `api/src/app.ts` from the validated `WEB_ORIGINS`, reflecting only configured origins with `credentials: true`. Two tests cover it. `buildApp` now requires a `webOrigins` argument. |
| API problem contract for `errors.ts` | `apiProblemSchema` exists in `@rentdito/contracts`. Centralised error serialisation is still to be written (Step 5). |
| Rate limiting for register and login | `@fastify/rate-limit` is a declared dependency but **not yet imported**. Step 5 wires it. |
| Idempotency for mutating routes | `createIdempotencyRunner` exists in `api/src/plugins/idempotency.ts` with an in-memory store. A Supabase-backed `IdempotencyStore` adapter is still unwritten; `public.idempotency_records` is already migrated and ready to back it. |
| Audit trail for the admin CLI | `public.audit_events` exists from Task 0 with RLS and revoked client grants. |
| `admin:create` / `admin:reset-password` scripts | Script **names** exist in `api/package.json` pointing at `dist/commands/adminAccounts.js`, which is not written yet. Running one today fails with a missing module. Step 5 creates the file. |
| Auth pages to modify | `frontend/src/pages/auth/SignInPage.tsx` and `RegisterPage.tsx` exist, currently prototype-only. |
| Demo session machinery to remove | `frontend/src/app/demo/DemoSessionProvider.tsx`, `demoSessionContext.ts`, and `frontend/src/features/demo-session/` are still production code paths. Step 6 removes them from production use; test helpers may remain under `src/test`. |

Not yet present, and needed later:

- `@supabase/supabase-js` is **not** declared in the frontend workspace. Step 6
  adds it (`^2.116.0`). It is already an API dependency.
- `frontend/.env.example` contains only `VITE_API_BASE_URL`. Step 6 needs
  `VITE_SUPABASE_URL` and the publishable key added there and to the root
  `.env.example`.
- `api/src/plugins/` contains only `idempotency.ts`. `supabase.ts`, `auth.ts`,
  and `errors.ts` are all still to be created.
- `supabase/migrations/` contains only `202609090001_foundation.sql`. The
  accounts migration `202609090002_accounts.sql` is unwritten.

## 5. Where to start

Step 2: write the failing tests before any implementation. The plan gives
concrete assertions for `api/test/auth.test.ts` and the core
`throws_ok` assertion for `supabase/tests/database/002_accounts_rls.test.sql`.

Two practical notes for that step:

- `buildApp` requires `webOrigins` now. Auth tests constructing an app must
  pass it, as `api/test/meta.test.ts` does.
- Step 3 expects a genuine red state. Confirm the API tests fail because the
  routes are missing and the database test fails because the tables are
  missing — not because of a typo or an unbuilt contracts package.

## 6. The release blocker

**Step 9 cannot be completed, and neither can Task 0's own acceptance.**

Task 0 was never deployed. Its staging deployment and smoke test remain
`Pending` in `docs/task-0-foundation-implementation.md` section 1, and section
15 of that document states the staging deploy must be finished before Task 1 is
released. Task 1's Step 9 then depends on the same infrastructure.

Concretely, none of the following has ever happened:

- The Fastify API has never booted on Render.
- The foundation migration has never been applied to a hosted Supabase project.
- The Vercel SPA has never been served.

Steps 2 through 8 are pure code and are safe to implement in the meantime. But
the further Task 1 progresses, the more expensive a foundation-level surprise
becomes. Section 12 of the Task 0 document is the runbook; it needs a human
with Supabase, Render, and Vercel access.

## 7. Verification

The Task 1 feature gate, from the plan's Step 8:

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

State after Step 1, on a clean install:

| Gate | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | 16 files, 106 tests passed |
| `npm run build` | Passed |
| `npm run e2e` | 51 passed, 1 skipped |
| `npm run db:reset` / `db:lint` / `db:test` | Passed, no errors, 10 pgTAP assertions |

One caveat on that database run: local Docker could not pull the
`postgres:17.6.1.167` image the pinned CLI requests, so it executed against a
locally retagged `17.6.1.165`. A patch-build difference is immaterial for the
foundation DDL, but it is not byte-identical to CI. CI itself has run green on
`main`.

## 8. Related documents

- Task 0 foundation and its audit remediation:
  `docs/task-0-foundation-implementation.md`
- Feature-by-feature plan and the authoritative Task 1 steps:
  `docs/superpowers/plans/2026-09-09-rentdito-production-mvp-feature-rollout.md`
- Product and production architecture:
  `docs/superpowers/specs/2026-09-09-rentdito-mvp-production-architecture-design.md`
