# RentDito Production MVP Architecture Design

**Date:** 2026-09-09  
**Status:** Approved in conversation; awaiting written-spec review  
**Scope:** Convert the existing frontend prototype into a production MVP that ships one complete feature slice at a time

## 1. Product intent

RentDito combines a public Philippine rental marketplace with role-specific workspaces for landlords, tenants, and internal administrators. The existing frontend defines the baseline user experience, but the production MVP replaces local demo state with authenticated, authorized, durable data and adds the minimum missing workflows needed to operate the product:

- Landlords create and submit property listings.
- Administrators review listings before publication.
- Landlords invite tenants into a unit through a one-time code or link.
- Tenants upload an image of a payment receipt.
- Landlords approve or reject the proof before a due becomes paid.

The MVP does not process money, collect bank or card credentials, interpret receipts automatically, support mutable user roles, or provide email/SMS notifications.

## 2. Approved platform architecture

RentDito uses an API-first modular monolith:

```text
Vercel React PWA
      |
      | HTTPS and Supabase access token
      v
Render TypeScript API
      |
      +-- Supabase Auth
      +-- Supabase Postgres
      +-- Private Supabase Storage
```

### 2.1 Vercel frontend

Vercel hosts the existing React, TypeScript, Vite, and React Router PWA. It provides preview and production builds. A SPA rewrite sends application routes to `index.html`. The frontend receives only public environment configuration and never receives a Supabase service-role key or database password.

The frontend continues to depend on repository interfaces. Each local mock implementation is replaced feature-by-feature by an HTTP implementation, allowing unfinished slices to remain testable without mixing mock and production data on the same production route.

### 2.2 Render API

Render hosts one TypeScript API organized into domain modules rather than separately deployed microservices. The API owns authentication orchestration, validation, authorization, business state transitions, signed Storage access, audit recording, and response contracts.

The service binds to Render's assigned `PORT`, exposes an application-level health endpoint, and reads secrets from Render environment configuration. The health endpoint checks that the process is ready and that required Supabase connectivity is available without exposing secret or tenant data.

### 2.3 Supabase

Supabase provides:

- Auth for password hashing, sessions, refresh tokens, and signed access tokens.
- Postgres for transactional application records.
- Private Storage buckets for unpublished listing photos and payment receipts.
- Row Level Security for every exposed application and Storage table.

Production, staging, and local development use separate data and Storage. Production credentials never appear in preview deployments.

## 3. Authentication and authorization

### 3.1 Fixed roles

Application roles are `tenant`, `landlord`, and `admin`.

- Public registration allows only `tenant` or `landlord`.
- The chosen role is permanent after account creation.
- Admin accounts are provisioned through a private operational process and cannot be selected through public registration.
- The database prevents ordinary users from changing their role.

### 3.2 Username and password

Every account uses a globally unique, case-insensitive username and a password. Supabase Auth does not expose native username/password authentication, so the Render API maps the normalized username to a hidden Supabase Auth identifier. Supabase continues to store and verify password hashes and issue sessions; the hidden identifier is never shown as the user's contact address.

Registration normalizes the username, enforces a database unique constraint, creates the Supabase Auth identity, and creates the application profile as one coordinated operation. Partial creation is compensated so an unusable Auth identity or profile is not left behind.

Login accepts username and password, resolves the hidden identifier server-side, and delegates password verification to Supabase Auth. Login and registration errors remain generic enough to prevent account enumeration. Both endpoints are rate-limited.

Because the product collects no email address or phone identity, self-service password recovery is outside the MVP. Account recovery is an administrator-assisted operational action.

### 3.3 Authorization boundaries

- Public users may read only published listings and their public units and media.
- Tenants may read and change only their own profile, saved listings, inquiries, invitations, tenancy, dues, payment proofs, and payments.
- Landlords may read and change only properties they own and records related to those properties and tenancies.
- Admins may review listings and perform explicitly defined recovery operations.
- Render validates the access token and role on every protected request.
- User-scoped database access remains constrained by Supabase RLS as a second boundary.
- The service role is limited to server-only operations that cannot be expressed safely with a user-scoped client.

## 4. Domain records and invariants

### 4.1 Accounts and profiles

`profiles` references the Supabase Auth user and stores the normalized username, display name, phone number when supplied, immutable application role, account status, and timestamps. Usernames are globally unique after normalization.

### 4.2 Properties, units, media, and review

`properties` belongs to one landlord and stores the public listing content and moderation state. `units` belongs to a property and stores bedrooms, bathrooms, floor area, monthly rent, deposit, and operational status. `property_media` stores ordered references to private Storage objects. `listing_reviews` records submission, reviewer, decision, reason, and timestamps.

Property moderation uses this state machine:

```text
draft -> submitted -> published
                   -> changes_requested -> draft
published -> unpublished -> draft
```

Only the owning landlord may edit a draft. Submitting locks the public content until a reviewer makes a decision. Rejection requires a reason. Only `published` properties appear in public search. Editing a published listing requires an explicit unpublish action followed by another review.

The public interface must not label a landlord as identity-verified merely because a listing was reviewed. The existing cue becomes `Listing reviewed` until a separate identity-verification process exists.

Unit statuses remain `available`, `occupied`, `reserved`, and `maintenance`. A unit with an active tenancy cannot be made available. Only available units on published properties appear as rentable inventory.

### 4.3 Saved listings and inquiries

Guests may keep saved listing identifiers locally. Signed-in tenants persist saved listings to their account. Submitting an inquiry requires a tenant account because the MVP has no email or phone channel for anonymous follow-up.

An inquiry belongs to a tenant, landlord, and property. Inquiry messages form a chronological thread. A tenant may initiate and follow their own threads; the property's landlord may reply. Each list query is scoped to the signed-in participant.

### 4.4 Tenancy invitations and tenancies

A landlord creates an invitation containing the property, unit, tenant-facing lease terms, monthly rent, deposit, lease start and end dates, and monthly due day. The API generates a cryptographically random, high-entropy, single-use code. Only a hash of the code is stored. The invitation expires, may be revoked by the landlord, and cannot be accepted twice.

The landlord copies the invite link or code and shares it through a channel outside RentDito. The recipient registers as a tenant or signs into an existing tenant account, reviews the exact terms, and accepts.

Acceptance occurs transactionally: the invitation is consumed, the tenancy is created, and the unit becomes `reserved` for a future lease or `occupied` for a current lease. A landlord account cannot accept a tenant invitation. Ending a tenancy releases the relationship but does not delete its dues, proofs, payments, or audit history.

### 4.5 Dues and payments

An idempotent scheduled operation generates monthly dues from accepted tenancies. A uniqueness constraint prevents duplicate dues for the same tenancy and billing period. Due state is calculated from amount, approved payments, active payment proof, and due date rather than from dashboard totals.

The landlord may manually record an externally confirmed payment. Manual records may be partial but cannot exceed the outstanding balance. The action records who entered it and updates the due in one transaction.

### 4.6 Payment proofs

A tenant may submit one active proof for the full outstanding balance of a due. A proof records the due, tenant, landlord, private Storage path, original file metadata, submission time, review state, reviewer, review time, and rejection reason.

The proof state machine is:

```text
submitted -> approved
          -> rejected -> eligible for a new submission
```

Submitting a proof changes the visible due state to `proof_pending` but does not create a payment or reduce the balance. Approval atomically creates the full remaining payment, settles the due, marks the proof approved, and records the landlord reviewer. Rejection requires a reason, leaves the balance unchanged, and allows the tenant to submit a new proof.

If the landlord manually settles a due while a proof is pending, the API prevents a later duplicate approval and records the proof as no longer actionable.

### 4.7 Audit history

An append-only `audit_events` record is written for account-role assignment, listing submission and review, invitation creation/revocation/acceptance, tenancy state changes, unit-status changes, manual payment recording, and payment-proof decisions. Events identify the actor, action, target, timestamp, and non-secret decision metadata.

## 5. Storage design

Listing media and payment receipts use separate private buckets. Object keys are generated by the server and scoped by owner and record identifier; clients do not select arbitrary paths.

The API issues short-lived signed upload URLs after authorization. A client uploads directly to Storage, then finalizes the related database record through the API. The finalization step verifies expected ownership, object path, allowed type, and size.

Receipt uploads accept JPEG, PNG, or WebP only. Bucket limits and server validation enforce the maximum size and inspect actual file content rather than trusting only the extension or browser-provided MIME type. Receipt view URLs are short-lived and issued only to the submitting tenant, the owning landlord, or an authorized administrator. Logs and audit events never contain signed URLs.

An idempotent cleanup task removes expired, abandoned uploads that were never attached to a database record.

## 6. User-facing workflows

### 6.1 Marketplace

- Anyone can search and filter published listings and open listing details.
- A guest may save locally; a tenant may save to their account.
- Inquiry submission redirects unsigned users to login and returns them to the intended listing afterward.
- Landlord and admin roles cannot submit tenant inquiries.

### 6.2 Landlord listing creation

- Create a property draft.
- Add and edit units.
- Upload and order photos.
- Add amenities, rules, rent, deposits, availability, and address details.
- Preview the listing as it will appear publicly.
- Submit it for administrator review.
- Read a requested-changes reason, edit, and resubmit.
- Explicitly unpublish before changing a published listing.

### 6.3 Administrator moderation

- View a queue ordered by submission time.
- Filter by review state and landlord.
- Preview all listing content and images.
- Publish or request changes.
- Require a reason when requesting changes.
- Preserve the reviewer and decision history.

### 6.4 Tenancy invitation

- The landlord selects one eligible unit and enters lease terms.
- The system shows the terms for review before creating the invitation.
- The landlord copies the generated link or code.
- The tenant opens the invitation, authenticates, reviews the terms, and accepts.
- The resulting rental appears in both workspaces.

### 6.5 Receipt review

- The tenant opens an unpaid due and sees the exact balance.
- The tenant uploads one receipt image and reviews it before submission.
- The due shows `Proof pending`; a second submission is blocked.
- The landlord opens the payment queue and views the private receipt.
- Approval shows the amount and resulting balance before confirmation.
- Rejection requires a specific reason.
- Both roles see the durable decision and updated due state.

## 7. Feature-by-feature rollout

Every slice produces deployable software. Navigation and actions for incomplete slices stay hidden behind server-controlled feature flags.

### Slice 0: Delivery foundation

Deploy the Vercel frontend, Render API health endpoint, Supabase migration baseline, seed data, private buckets, environment separation, CI checks, and release configuration.

**Exit gate:** staging and production build from source; the frontend reaches the correct API; health checks and a safe database readiness check pass; secrets exist only in the intended platform.

### Slice 1: Accounts and fixed roles

Replace demo-role switching with username/password registration, login, logout, session restoration, protected routes, role-specific navigation, and administrator provisioning.

**Exit gate:** tenant, landlord, and admin access tests pass; usernames are unique case-insensitively; cross-role routes and API operations are denied; sessions refresh and logout invalidates local state.

### Slice 2: Public marketplace

Back public listing search, filters, details, loading, empty states, and private-media delivery with published Supabase data.

**Exit gate:** only published listings and available units appear; URL filters remain stable; unpublished data and media cannot be fetched through guessed identifiers.

### Slice 3: Landlord listing creation

Add property draft creation, unit editing, photo upload/order, listing preview, validation, and submission.

**Exit gate:** a landlord can complete and submit a listing but cannot access another landlord's drafts; invalid and abandoned uploads are recoverable and cleaned safely.

### Slice 4: Administrator moderation

Add the admin workspace, review queue, listing preview, publish/request-changes decisions, reasons, and audit history.

**Exit gate:** only an admin can decide; publication changes public search; rejected content stays private; duplicate decisions are safe.

### Slice 5: Saved listings and inquiries

Persist tenant saves, migrate guest-local saves after login when appropriate, require tenant authentication for inquiries, and enable landlord replies.

**Exit gate:** participants see only their records; inquiry redirects return to the intended listing; reply chronology persists across sessions.

### Slice 6: Tenancy invitations

Add invitation creation, copyable one-time codes, public invite resolution, tenant authentication, terms review, acceptance, expiry, and revocation.

**Exit gate:** codes cannot be enumerated or reused; acceptance creates exactly one tenancy; the unit state updates transactionally; wrong-role acceptance is denied.

### Slice 7: Tenant rental and dues

Back the tenant dashboard, current-rental details, landlord contact, due list, payment history, and idempotent monthly due generation.

**Exit gate:** each tenant sees only their tenancy; duplicate generation creates no duplicate due; balances and due states match stored payments.

### Slice 8: Receipt upload and approval

Replace simulated Pay Now with receipt upload, proof review, pending states, landlord approval/rejection, private image access, and durable outcomes.

**Exit gate:** submission never changes a balance; approval settles once; rejection preserves the balance; unauthorized receipt access and duplicate approval fail safely.

### Slice 9: Landlord operations

Back portfolio KPIs, property/unit management, tenant lists/details, outstanding dues, payment history, manual payment recording, and inquiry workload.

**Exit gate:** aggregates match source records; active-tenancy conflicts are enforced; partial manual payments cannot exceed the balance; all records are landlord-scoped.

### Slice 10: Production hardening

Complete PWA/offline behavior, accessibility verification, responsive checks, audit review, rate limits, backup/restore rehearsal, monitoring, and launch smoke tests.

**Exit gate:** all primary journeys pass on desktop and mobile; private records resist cross-account access; production contains no demo switcher, mock persistence, simulated payment copy, or reset-demo action.

## 8. Release mechanics

Each slice includes its database migration, API contract and implementation, frontend integration, automated tests, staging acceptance, and production deployment. Schema additions must remain compatible with the currently deployed API and frontend.

The deployment order is:

1. Apply the backward-compatible Supabase migration.
2. Deploy the Render API and pass its health check.
3. Deploy the Vercel frontend with the feature disabled.
4. Run staging smoke tests.
5. Enable the feature.
6. Monitor errors and audit events.

Rollback returns the frontend and API to their preceding versions. Compatible additive database changes remain in place and are removed only through a later reviewed migration.

## 9. Error handling and idempotency

API errors use stable machine-readable codes, safe human-readable messages, field-level validation details when applicable, and a request identifier. Authorization failures do not reveal whether an inaccessible record exists.

Business-changing requests accept an idempotency key where browser retries could duplicate work. Listing decisions, invitation acceptance, due generation, payment recording, and proof approval also have database uniqueness or state-transition guards.

The frontend preserves form input after recoverable errors, shows the affected scope, and supplies a corrective action or retry. A failed upload, rejected proof, interrupted request, or offline action never claims a successful payment or listing decision.

## 10. Verification strategy

Every feature slice includes:

- Domain unit tests for state machines, balances, dates, and authorization helpers.
- Migration tests and Supabase RLS tests, including denied cross-account access.
- API integration tests against local Supabase services.
- Contract tests proving the HTTP repository matches the frontend repository interface.
- React integration tests for loading, empty, validation, error, and success states.
- Playwright coverage for the primary desktop and mobile journey introduced by the slice.
- Accessibility checks for changed pages, dialogs, forms, and status announcements.
- Type checking, linting, unit/integration tests, end-to-end tests, and production builds in CI.

Security-sensitive slices additionally test expired and reused invite codes, unauthorized Storage paths, mismatched file content, duplicate approvals, overpayments, role escalation attempts, and guessed record identifiers.

## 11. Operational requirements

- Structured logs include request identifiers but exclude passwords, access tokens, invitation secrets, signed Storage URLs, and receipt contents.
- Health checks and alerts distinguish process readiness from dependency failure.
- Database migrations are versioned and repeatable.
- Production backups are enabled and a restore is rehearsed before launch.
- Seed and demo-reset operations are unavailable in production.
- Audit events are queryable by authorized administrators and retained with the related business records.

## 12. Definition of Done

The MVP is complete when:

- All eleven slices have passed their exit gates and are enabled in production.
- Guests, tenants, landlords, and admins can complete their authorized primary journeys.
- Listings cannot become public without an administrator decision.
- Invitations are expiring, revocable, single-use, and create exactly one tenancy.
- Tenant receipt submission does not change a balance before landlord approval.
- Payment approval, rejection, and manual recording are durable and auditable.
- Private data and media resist cross-account and guessed-identifier access.
- Dashboard values derive correctly from authoritative records.
- The frontend is responsive, keyboard-accessible, screen-reader usable, and installable as a PWA.
- Production uses Vercel, Render, and Supabase with environment separation and no demo-only behavior.

