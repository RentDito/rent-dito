# RentDito Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable, responsive RentDito frontend prototype that demonstrates public rental discovery, landlord property management, and tenant dues/payment journeys using persistent local mock data.

**Architecture:** Use a feature-oriented React application with dependency direction `app -> pages -> features -> entities -> shared`. Pages compose feature components, feature use cases depend on repository contracts, and a browser-backed mock adapter implements those contracts at the app composition boundary so a future API adapter can replace it without page rewrites.

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, CSS custom properties and CSS Modules, Vitest, Testing Library, MSW-style repository fakes where useful, Playwright, axe accessibility checks, and a Vite PWA plugin.

**Spec:** `docs/superpowers/specs/2026-09-08-rentdito-frontend-design.md`

## Global Constraints

- Frontend-only prototype; do not add or modify backend code.
- Use Philippine peso, Philippine locations, English-first copy, and realistic but fictional personal data.
- Never imply that authentication, inquiry delivery, or payment processing is real.
- Use the approved core palette: `#5B3FD6`, `#3720A5`, `#F1EEFF`, `#18202B`, `#667085`, `#F7F8FC`, `#FFFFFF`, `#16865B`, `#B86A00`, `#C63F4A`, and `#2563EB`.
- Use Inter Variable, a 4px spacing scale, 14–18px primary card radii, WCAG AA contrast, visible focus, semantic HTML, and minimum 44px touch targets.
- Use 120ms, 180ms, and 240ms motion tokens only; respect `prefers-reduced-motion` and avoid layout-shifting animations.
- Status must always combine color with readable text and optionally an icon.
- Mutations persist locally, can be reset to versioned seed data, and are disabled with an honest message when offline.
- Every repository-fed page must render a shape-preserving loading state, a true-empty state, a filter no-match state where applicable, and a recoverable section error with retry.
- Automated accessibility checks must cover representative public, landlord, and tenant routes in both desktop and mobile browser projects.
- Keep files focused; page modules compose features and must not import seed data or storage adapters directly.
- The current workspace is not a Git repository. Run commit steps only if the user initializes Git before or during execution; otherwise record the intended commit message in the task handoff.

## Planned File Structure

```text
frontend/
  index.html                         # HTML shell and metadata
  package.json                       # scripts and dependencies
  tsconfig*.json                     # TypeScript configuration
  vite.config.ts                     # Vite, Vitest, and PWA configuration
  playwright.config.ts               # end-to-end configuration
  public/
    logo.png                         # user-supplied source logo
    icons/                           # generated PWA icon variants
    properties/                      # locally generated fictional rental photography
  src/
    main.tsx                         # browser entry point
    app/
      App.tsx                        # provider composition
      router.tsx                     # route tree and route fallbacks
      queryClient.ts                 # Query defaults
      repositories.ts                # repository dependency composition
      demo/DemoSessionProvider.tsx   # prototype role and reset controls
      layouts/PublicLayout.tsx       # marketplace shell
      layouts/WorkspaceLayout.tsx    # landlord/tenant adaptive shell
    pages/                           # route-only composition modules
      marketplace/*.tsx
      landlord/*.tsx
      tenant/*.tsx
      auth/*.tsx
      SettingsPage.tsx
      OfflinePage.tsx
      NotFoundPage.tsx
    features/
      listing-search/                # filtering and sorting use case/UI
      saved-listings/                # browser-persisted saved state
      inquiry/                       # inquiry form and timeline
      unit-status/                   # validated status mutation
      payment/                       # due/confirmation/pay-now flows
      demo-session/                  # reset and role switching UI
    entities/
      property/                      # property/unit domain and cards
      tenancy/                       # tenant/rental domain
      payment/                       # due/payment domain and status rules
      inquiry/                       # inquiry domain and status rules
      user/                          # demo role and profile domain
    shared/
      api/contracts.ts               # RentDitoRepository contract
      api/mock/MockRentDitoRepository.ts
      api/mock/seed.ts               # versioned connected demo records
      lib/format.ts                  # peso/date/address formatting
      lib/storage.ts                 # guarded localStorage access
      hooks/useOnlineStatus.ts        # browser connectivity state
      ui/                             # focused accessible primitives
      styles/tokens.css
      styles/globals.css
      types/status.ts
    test/
      render.tsx                     # provider-aware test renderer
      setup.ts                       # jest-dom and browser mocks
  e2e/
    marketplace.spec.ts
    landlord.spec.ts
    tenant-payment.spec.ts
    responsive-a11y.spec.ts
```

---

### Task 1: Bootstrap the tested PWA frontend and design tokens

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/eslint.config.js`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/shared/styles/tokens.css`
- Create: `frontend/src/shared/styles/globals.css`
- Create: `frontend/src/shared/lib/format.test.ts`
- Create: `frontend/src/shared/lib/format.ts`
- Create: `frontend/src/test/setup.ts`

**Interfaces:**
- Produces: `formatCurrency(value: number): string`, `formatDate(value: string | Date): string`, the `@/*` source alias, global theme tokens, and scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:run`, `e2e`.
- Consumes: approved color, typography, spacing, radius, shadow, motion, accessibility, and Philippine-locale requirements from the spec.

- [ ] **Step 1: Create the Vite/TypeScript/test configuration and install the declared dependencies**

Use a React TypeScript Vite package with runtime dependencies `@tanstack/react-query`, `lucide-react`, `react`, `react-dom`, `react-hook-form`, `react-router-dom`, `zod`, and `@hookform/resolvers`. Add development dependencies for Vite React, TypeScript, ESLint, Vitest, jsdom, Testing Library, Playwright, axe, and Vite PWA support. Configure `@` to resolve to `frontend/src` and set Vitest to `jsdom` with `src/test/setup.ts`.

Run from `frontend` after creating the complete `package.json`:

```bash
npm install
npx playwright install chromium
```

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint .",
    "test": "vitest",
    "test:run": "vitest run",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Write the failing locale-format tests**

```ts
import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('Philippine presentation formatting', () => {
  it('formats whole peso amounts without centavos', () => {
    expect(formatCurrency(18500)).toBe('₱18,500');
  });

  it('formats dates in an unambiguous English Philippine style', () => {
    expect(formatDate('2026-09-15T00:00:00+08:00')).toBe('Sep 15, 2026');
  });
});
```

- [ ] **Step 3: Run the focused test and confirm the red state**

Run: `npm run test:run -- src/shared/lib/format.test.ts`

Expected: FAIL because `./format` does not exist.

- [ ] **Step 4: Implement the formatters and approved token system**

```ts
const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number) => peso.format(value);

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila',
  }).format(new Date(value));
```

Define semantic CSS variables for every approved color, typography role, 4px spacing increment, 14/16/18px card radii, focus ring, subtle elevations, and 120/180/240ms motion. Add a `prefers-reduced-motion` block that reduces animation and transition duration to effectively zero. Render a minimal `App` landmark so the build has a valid entry point.

- [ ] **Step 5: Run focused tests and static checks**

Run: `npm run test:run -- src/shared/lib/format.test.ts`

Expected: 2 tests PASS.

Run: `npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0 and `frontend/dist` is produced.

- [ ] **Step 6: Commit if Git is available**

```bash
git add frontend
git commit -m "chore: bootstrap RentDito frontend design system"
```

---

### Task 2: Define domain models, status rules, and persistent mock repository

**Files:**
- Create: `frontend/src/entities/property/model.ts`
- Create: `frontend/src/entities/tenancy/model.ts`
- Create: `frontend/src/entities/payment/model.ts`
- Create: `frontend/src/entities/payment/status.ts`
- Create: `frontend/src/entities/payment/status.test.ts`
- Create: `frontend/src/entities/inquiry/model.ts`
- Create: `frontend/src/entities/user/model.ts`
- Create: `frontend/src/shared/api/contracts.ts`
- Create: `frontend/src/shared/api/mock/seed.ts`
- Create: `frontend/src/shared/api/mock/MockRentDitoRepository.ts`
- Create: `frontend/src/shared/api/mock/MockRentDitoRepository.test.ts`
- Create: `frontend/src/shared/lib/storage.ts`
- Create: `frontend/src/app/repositories.ts`

**Interfaces:**
- Produces: `UserRole`, `Property`, `Unit`, `Tenancy`, `Due`, `Payment`, `Inquiry`, `ListingFilters`, `RentDitoRepository`, `createMemoryStorage()`, `createMockRepository(storage?)`, `getDueStatus(due, now)`.
- `RentDitoRepository` methods: `listProperties(filters): Promise<Property[]>`, `getProperty(id): Promise<Property | null>`, `toggleSaved(propertyId): Promise<boolean>`, `listTenancies(): Promise<Tenancy[]>`, `listDues(): Promise<Due[]>`, `listPayments(): Promise<Payment[]>`, `listInquiries(role): Promise<Inquiry[]>`, `submitInquiry(input: { propertyId: string; message: string }): Promise<Inquiry>`, `updateUnitStatus(input: { unitId: string; status: UnitStatus }): Promise<Unit>`, `recordPayment(input: { dueId: string; amount: number; method: PaymentMethod; source: 'landlord' | 'tenant' }): Promise<Payment>`, and `resetDemoData(): void`.

- [ ] **Step 1: Write failing status-rule tests**

```ts
describe('getDueStatus', () => {
  const now = new Date('2026-09-08T12:00:00+08:00');
  it('returns paid when paidAmount covers amount', () => {
    expect(getDueStatus({ amount: 18000, paidAmount: 18000, dueDate: '2026-09-01' }, now)).toBe('paid');
  });
  it('returns overdue after the unpaid due date', () => {
    expect(getDueStatus({ amount: 18000, paidAmount: 0, dueDate: '2026-09-01' }, now)).toBe('overdue');
  });
  it('returns due-soon within seven days', () => {
    expect(getDueStatus({ amount: 18000, paidAmount: 0, dueDate: '2026-09-12' }, now)).toBe('due-soon');
  });
});
```

- [ ] **Step 2: Run the status tests and confirm the red state**

Run: `npm run test:run -- src/entities/payment/status.test.ts`

Expected: FAIL because the payment model and `getDueStatus` are undefined.

- [ ] **Step 3: Implement focused domain types and status calculation**

```ts
export type DueStatus = 'paid' | 'partial' | 'overdue' | 'due-soon' | 'upcoming';
export type DueLike = { amount: number; paidAmount: number; dueDate: string };

export function getDueStatus(due: DueLike, now = new Date()): DueStatus {
  if (due.paidAmount >= due.amount) return 'paid';
  if (due.paidAmount > 0) return 'partial';
  const days = Math.ceil((new Date(due.dueDate).getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due-soon';
  return 'upcoming';
}
```

Define narrow, serializable domain models with stable string IDs. Make property-unit, tenancy-unit, due-tenancy, payment-due, and inquiry-property relationships explicit.

- [ ] **Step 4: Write failing repository persistence and invariant tests**

```ts
it('persists a submitted inquiry and restores versioned seed data', async () => {
  const storage = createMemoryStorage();
  const repo = createMockRepository(storage, { delayMs: 0 });
  const before = await repo.listInquiries('tenant');
  await repo.submitInquiry({ propertyId: 'prop-makati-01', message: 'Is Unit 8B available?' });
  expect(await repo.listInquiries('tenant')).toHaveLength(before.length + 1);
  repo.resetDemoData();
  expect(await repo.listInquiries('tenant')).toHaveLength(before.length);
});

it('rejects marking an actively leased unit available', async () => {
  const repo = createMockRepository(createMemoryStorage(), { delayMs: 0 });
  await expect(repo.updateUnitStatus({ unitId: 'unit-occupied-01', status: 'available' }))
    .rejects.toThrow('End the active tenancy before making this unit available.');
});
```

- [ ] **Step 5: Run repository tests and confirm the red state**

Run: `npm run test:run -- src/shared/api/mock/MockRentDitoRepository.test.ts`

Expected: FAIL because the repository, seed, and memory storage helper do not exist.

- [ ] **Step 6: Implement connected seed data and the repository adapter**

Create at least six listings across Metro Manila, Cebu, and Davao, including apartments, condominiums, houses, and bedspaces. Seed one landlord portfolio with multiple properties/units and one tenant with an active tenancy, overdue history, upcoming due, payments, and inquiry threads. Use fictional names and contact details. Store `{ version: 1, data }` under `rentdito:demo-data`; on version mismatch or parse failure, safely restore the seed.

Every repository method returns a promise after the configured delay. Mutations validate domain rules, persist atomically, and return the updated entity. Export one repository instance from `app/repositories.ts`; no page imports the mock class.

- [ ] **Step 7: Run domain/repository tests and static checks**

Run: `npm run test:run -- src/entities/payment/status.test.ts src/shared/api/mock/MockRentDitoRepository.test.ts`

Expected: all focused tests PASS.

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 8: Commit if Git is available**

```bash
git add frontend/src/entities frontend/src/shared/api frontend/src/shared/lib/storage.ts frontend/src/app/repositories.ts
git commit -m "feat: add RentDito domain and mock repository"
```

---

### Task 3: Build accessible UI primitives, feedback states, and test renderer

**Files:**
- Create: `frontend/src/shared/ui/Button/Button.tsx`
- Create: `frontend/src/shared/ui/Button/Button.module.css`
- Create: `frontend/src/shared/ui/Field/Field.tsx`
- Create: `frontend/src/shared/ui/StatusBadge/StatusBadge.tsx`
- Create: `frontend/src/shared/ui/Card/Card.tsx`
- Create: `frontend/src/shared/ui/Dialog/Dialog.tsx`
- Create: `frontend/src/shared/ui/Drawer/Drawer.tsx`
- Create: `frontend/src/shared/ui/Feedback/Feedback.tsx`
- Create: `frontend/src/shared/ui/Skeleton/Skeleton.tsx`
- Create: `frontend/src/shared/ui/DataTable/DataTable.tsx`
- Create: `frontend/src/shared/ui/ui.test.tsx`
- Create: `frontend/src/test/render.tsx`

**Interfaces:**
- Produces: `Button`, `Field`, `StatusBadge`, `Card`, `Dialog`, `Drawer`, `EmptyState`, `InlineAlert`, `Skeleton`, and generic `DataTable<T>`.
- Consumes: global tokens and semantic entity statuses from Tasks 1–2.

- [ ] **Step 1: Write failing accessibility and behavior tests**

```tsx
it('associates field errors and focuses a confirmation dialog', async () => {
  render(<Field label="Message" error="Write at least 10 characters"><textarea /></Field>);
  expect(screen.getByLabelText('Message')).toHaveAccessibleDescription('Write at least 10 characters');

  const user = userEvent.setup();
  render(<Dialog open title="Change unit status" onClose={() => {}}><Button>Confirm change</Button></Dialog>);
  expect(screen.getByRole('dialog', { name: 'Change unit status' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Confirm change' })).toHaveFocus();
  await user.keyboard('{Escape}');
});

it('renders status as readable text instead of color alone', () => {
  render(<StatusBadge tone="danger">Overdue</StatusBadge>);
  expect(screen.getByText('Overdue')).toBeVisible();
});
```

- [ ] **Step 2: Run the UI tests and confirm the red state**

Run: `npm run test:run -- src/shared/ui/ui.test.tsx`

Expected: FAIL because the shared UI components do not exist.

- [ ] **Step 3: Implement minimal accessible primitives**

Implement semantic native controls, forwarding refs and native attributes. `Field` must generate stable IDs, connect hints/errors with `aria-describedby`, and expose `aria-invalid`. `Dialog` and `Drawer` must label their surfaces, move focus inside on open, close on Escape, restore prior focus, and prevent background interaction. `DataTable<T>` accepts `columns: Array<{ key: string; header: string; cell: (row: T) => ReactNode; mobileLabel?: string }>` and renders a real table plus a CSS-driven labeled card presentation at narrow widths.

- [ ] **Step 4: Run UI tests and static checks**

Run: `npm run test:run -- src/shared/ui/ui.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 5: Commit if Git is available**

```bash
git add frontend/src/shared/ui frontend/src/test
git commit -m "feat: add accessible RentDito UI primitives"
```

---

### Task 4: Compose routing, adaptive shells, and demo session switching

**Files:**
- Create: `frontend/src/app/queryClient.ts`
- Create: `frontend/src/app/demo/DemoSessionProvider.tsx`
- Create: `frontend/src/features/demo-session/DemoRoleSwitcher.tsx`
- Create: `frontend/src/app/layouts/PublicLayout.tsx`
- Create: `frontend/src/app/layouts/WorkspaceLayout.tsx`
- Create: `frontend/src/app/layouts/layouts.module.css`
- Create: `frontend/src/app/router.tsx`
- Create: `frontend/src/pages/NotFoundPage.tsx`
- Create: `frontend/src/app/layouts/layouts.test.tsx`
- Modify: `frontend/src/app/App.tsx`

**Interfaces:**
- Produces: `DemoSessionProvider`, `useDemoSession(): { role: 'guest' | 'landlord' | 'tenant'; setRole(role): void; reset(): Promise<void> }`, `PublicLayout`, `WorkspaceLayout`, typed route-path constants, and public/workspace route branches.
- Consumes: repository composition, Query client, shared UI, and all later page default exports.

- [ ] **Step 1: Write failing responsive navigation and role tests**

```tsx
it('switches from guest to landlord and navigates to the correct workspace', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/', viewport: 'desktop' });
  await user.click(screen.getByRole('button', { name: 'View as' }));
  await user.click(screen.getByRole('menuitem', { name: 'Landlord demo' }));
  expect(await screen.findByRole('navigation', { name: 'Landlord workspace' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Properties' })).toBeVisible();
});

it('provides tenant primary destinations in mobile bottom navigation', () => {
  renderApp({ route: '/tenant', role: 'tenant', viewport: 'mobile' });
  expect(screen.getByRole('navigation', { name: 'Tenant mobile navigation' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Payments' })).toHaveAttribute('href', '/tenant/payments');
});
```

- [ ] **Step 2: Run the layout tests and confirm the red state**

Run: `npm run test:run -- src/app/layouts/layouts.test.tsx`

Expected: FAIL because layouts and session provider are undefined.

- [ ] **Step 3: Implement providers, route configuration, and adaptive navigation**

`App` composes `QueryClientProvider`, `DemoSessionProvider`, and `RouterProvider`. Use public routes for marketplace/auth and workspace routes for landlord/tenant. Keep the switcher visible only when `import.meta.env.VITE_DEMO_MODE !== 'false'`. On role selection, navigate to `/`, `/landlord`, or `/tenant`. Desktop uses a collapsible sidebar; CSS media queries expose bottom navigation below 768px. Every navigation uses text labels and active state through `aria-current`.

- [ ] **Step 4: Add route registration boundaries and route-level error handling**

Create the route branches and typed route-path constants for the complete route inventory. During this task, layout tests render their own index content through `Outlet`; application routes are registered as their real page modules are added in Tasks 5–9. Add `NotFoundPage` with links to home and the active workspace. Route failures render a section-level retry when recoverable or the safe route fallback otherwise.

- [ ] **Step 5: Run focused tests and static checks**

Run: `npm run test:run -- src/app/layouts/layouts.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 6: Commit if Git is available**

```bash
git add frontend/src/app frontend/src/features/demo-session frontend/src/pages/NotFoundPage.tsx
git commit -m "feat: add adaptive shells and demo role navigation"
```

---

### Task 5: Implement marketplace discovery, saving, and inquiry journey

**Files:**
- Create: `frontend/src/entities/property/PropertyCard.tsx`
- Create: `frontend/src/features/listing-search/useListingSearch.ts`
- Create: `frontend/src/features/listing-search/ListingFilters.tsx`
- Create: `frontend/src/features/saved-listings/SaveListingButton.tsx`
- Create: `frontend/src/features/inquiry/InquiryForm.tsx`
- Create: `frontend/src/features/inquiry/schema.ts`
- Create: `frontend/src/pages/marketplace/HomePage.tsx`
- Create: `frontend/src/pages/marketplace/ListingsPage.tsx`
- Create: `frontend/src/pages/marketplace/ListingDetailPage.tsx`
- Create: `frontend/src/pages/marketplace/SavedPage.tsx`
- Create: `frontend/src/pages/marketplace/marketplace.module.css`
- Create: `frontend/src/pages/marketplace/marketplace.test.tsx`
- Create: `frontend/public/properties/makati-condo.webp`
- Create: `frontend/public/properties/quezon-apartment.webp`
- Create: `frontend/public/properties/pasig-studio.webp`
- Create: `frontend/public/properties/cebu-house.webp`
- Create: `frontend/public/properties/davao-apartment.webp`
- Create: `frontend/public/properties/manila-bedspace.webp`
- Modify: `frontend/src/app/router.tsx`

**Interfaces:**
- Produces: query-key factory `listingKeys`, `useListingSearch(filters)`, `PropertyCard`, `ListingFilters`, `SaveListingButton`, and `InquiryForm`.
- Consumes: `RentDitoRepository`, `Property`, shared primitives/formatters, and public shell.

- [ ] **Step 1: Write failing marketplace journey tests**

```tsx
it('filters listings and preserves applied filters in the URL', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/listings' });
  await user.selectOptions(await screen.findByLabelText('Property type'), 'condominium');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.getByText(/condominium/i)).toBeVisible();
  expect(window.location.search).toContain('type=condominium');
});

it('submits an inquiry with property context and durable confirmation', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/listings/prop-makati-01' });
  await user.click(await screen.findByRole('button', { name: 'Inquire about this property' }));
  await user.type(screen.getByLabelText('Message'), 'May I schedule a viewing this Saturday?');
  await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
  expect(await screen.findByText('Inquiry saved in this prototype')).toBeVisible();
});
```

- [ ] **Step 2: Run tests and confirm the red state**

Run: `npm run test:run -- src/pages/marketplace/marketplace.test.tsx`

Expected: FAIL because marketplace pages and features are not implemented.

- [ ] **Step 3: Implement search state and reusable property cards**

Read filters from `URLSearchParams`, normalize them into `ListingFilters`, and pass them to `repository.listProperties`. Desktop renders an always-visible filter rail; mobile renders the same form in a drawer. Applied chips update individual query keys and Clear all removes only filter keys. Cards show image, verified cue, property type, location, rent, bedrooms, availability, and a labeled save control.

- [ ] **Step 4: Produce the local fictional property image set**

Use the `imagegen` skill to generate six distinct, realistic Philippine rental-property photographs with consistent natural daylight and editorial real-estate framing: Makati condominium interior, Quezon City apartment, Pasig studio, Cebu family house, Davao apartment, and Manila bedspace. Export optimized WebP assets at a shared 4:3 aspect ratio. Do not include visible faces, readable brands, watermarks, or text. Seed records reference these local paths so cards work offline and do not depend on third-party image hosts.

- [ ] **Step 5: Implement the four public pages and inquiry mutation**

Home renders the concise search hero, property-type chips, trust explanation, and featured listings. Listing detail renders gallery placeholders using seeded image URLs, essential facts, amenities, rules, landlord cues, and one persistent inquiry action. Validate inquiry messages with `z.string().trim().min(10).max(1000)`. On success, close the dialog, invalidate inquiry queries, and render confirmation in page content as well as a toast.

- [ ] **Step 6: Run marketplace tests and checks**

Run: `npm run test:run -- src/pages/marketplace/marketplace.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 7: Commit if Git is available**

```bash
git add frontend/src/entities/property frontend/src/features/listing-search frontend/src/features/saved-listings frontend/src/features/inquiry frontend/src/pages/marketplace
git commit -m "feat: add rental marketplace journey"
```

---

### Task 6: Implement landlord overview and property/unit management

**Files:**
- Create: `frontend/src/features/unit-status/UnitStatusForm.tsx`
- Create: `frontend/src/features/unit-status/useUpdateUnitStatus.ts`
- Create: `frontend/src/pages/landlord/LandlordDashboardPage.tsx`
- Create: `frontend/src/pages/landlord/PropertiesPage.tsx`
- Create: `frontend/src/pages/landlord/PropertyDetailPage.tsx`
- Create: `frontend/src/pages/landlord/landlord.module.css`
- Create: `frontend/src/pages/landlord/properties.test.tsx`
- Modify: `frontend/src/app/router.tsx`

**Interfaces:**
- Produces: `useUpdateUnitStatus()`, `UnitStatusForm`, portfolio KPI derivation, and landlord property routes.
- Consumes: properties/units, repository `updateUnitStatus`, shared KPI/card/table/dialog components, workspace shell.

- [ ] **Step 1: Write failing dashboard and unit-status tests**

```tsx
it('shows the landlord portfolio priorities without relying on charts', async () => {
  renderApp({ route: '/landlord', role: 'landlord' });
  expect(await screen.findByText('Expected this month')).toBeVisible();
  expect(screen.getByText('Collected')).toBeVisible();
  expect(screen.getByText('Overdue')).toBeVisible();
  expect(screen.getByText('Vacant units')).toBeVisible();
});

it('confirms a safe unit status change and keeps the result visible', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/landlord/properties/prop-makati-01', role: 'landlord' });
  await user.click(await screen.findByRole('button', { name: 'Change status for Unit 10A' }));
  await user.selectOptions(screen.getByLabelText('New unit status'), 'maintenance');
  await user.click(screen.getByRole('button', { name: 'Review change' }));
  await user.click(screen.getByRole('button', { name: 'Confirm status change' }));
  expect(await screen.findByText('Maintenance')).toBeVisible();
});
```

- [ ] **Step 2: Run tests and confirm the red state**

Run: `npm run test:run -- src/pages/landlord/properties.test.tsx`

Expected: FAIL because the landlord pages and unit status feature do not exist.

- [ ] **Step 3: Implement landlord KPI derivation and responsive properties list**

Calculate KPIs from seeded units, tenancies, dues, and payments rather than hard-coded totals. Use text-first KPI cards and a due/attention list. PropertiesPage supports search and status filter, states the displayed/total record count, and uses `DataTable`/mobile records with named status labels. The seeded dataset fits on one page, so the count is the explicit result boundary instead of inactive pagination.

- [ ] **Step 4: Implement contextual unit management**

PropertyDetailPage groups property facts and unit records. `UnitStatusForm` displays current status, new status, and consequence copy. It requires a review dialog before mutation. Domain errors such as an active tenancy conflict stay inline, keep the selection, and explain the corrective action. Disable submission offline.

- [ ] **Step 5: Run landlord tests and checks**

Run: `npm run test:run -- src/pages/landlord/properties.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 6: Commit if Git is available**

```bash
git add frontend/src/features/unit-status frontend/src/pages/landlord
git commit -m "feat: add landlord portfolio and unit management"
```

---

### Task 7: Implement landlord tenants, payments, and inquiries

**Files:**
- Create: `frontend/src/entities/tenancy/TenantSummary.tsx`
- Create: `frontend/src/entities/payment/PaymentStatusBadge.tsx`
- Create: `frontend/src/entities/inquiry/InquiryTimeline.tsx`
- Create: `frontend/src/features/payment/RecordPaymentForm.tsx`
- Create: `frontend/src/pages/landlord/TenantsPage.tsx`
- Create: `frontend/src/pages/landlord/TenantDetailPage.tsx`
- Create: `frontend/src/pages/landlord/LandlordPaymentsPage.tsx`
- Create: `frontend/src/pages/landlord/LandlordInquiriesPage.tsx`
- Create: `frontend/src/pages/landlord/operations.test.tsx`
- Modify: `frontend/src/app/router.tsx`

**Interfaces:**
- Produces: `TenantSummary`, `PaymentStatusBadge`, `InquiryTimeline`, `RecordPaymentForm`, and remaining landlord routes.
- Consumes: tenancy/payment/inquiry models, `recordPayment`, responsive table, formatters, and feedback primitives.

- [ ] **Step 1: Write failing operations tests**

```tsx
it('records a landlord-confirmed payment and updates the visible balance', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/landlord/tenants/tenant-01', role: 'landlord' });
  await user.click(await screen.findByRole('button', { name: 'Record payment' }));
  await user.type(screen.getByLabelText('Amount received'), '18000');
  await user.selectOptions(screen.getByLabelText('Payment method'), 'bank-transfer');
  await user.click(screen.getByRole('button', { name: 'Review payment' }));
  await user.click(screen.getByRole('button', { name: 'Confirm payment record' }));
  expect(await screen.findByText('Payment recorded')).toBeVisible();
  expect(screen.getByText('₱0 balance')).toBeVisible();
});

it('labels inquiry status and preserves chronological context', async () => {
  renderApp({ route: '/landlord/inquiries', role: 'landlord' });
  expect(await screen.findByText('Needs reply')).toBeVisible();
  expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run tests and confirm the red state**

Run: `npm run test:run -- src/pages/landlord/operations.test.tsx`

Expected: FAIL because the operations pages and payment form are absent.

- [ ] **Step 3: Implement tenant and payment records**

TenantsPage supports name/property/status search. TenantDetailPage keeps unit, tenancy dates, contact, outstanding balance, due history, and payment history in one clear record. `RecordPaymentForm` validates `amount > 0`, `amount <= remaining balance`, method, and payment date; it shows a review step naming tenant, unit, billing period, amount, and resulting balance before persistence.

- [ ] **Step 4: Implement landlord inquiry list and timeline**

Group inquiries by property and newest activity. Display `new`, `needs-reply`, and `resolved` as labeled statuses. Timeline uses an ordered list with sender, date/time, and message; the mock reply action adds a landlord response locally and leaves the updated thread visible.

- [ ] **Step 5: Run operations tests and checks**

Run: `npm run test:run -- src/pages/landlord/operations.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 6: Commit if Git is available**

```bash
git add frontend/src/entities/tenancy frontend/src/entities/payment frontend/src/entities/inquiry frontend/src/features/payment frontend/src/pages/landlord
git commit -m "feat: add landlord tenant payment and inquiry tools"
```

---

### Task 8: Implement tenant dashboard, rental details, and simulated Pay Now

**Files:**
- Create: `frontend/src/features/payment/PayNowFlow.tsx`
- Create: `frontend/src/features/payment/payNowSchema.ts`
- Create: `frontend/src/pages/tenant/TenantDashboardPage.tsx`
- Create: `frontend/src/pages/tenant/CurrentRentalPage.tsx`
- Create: `frontend/src/pages/tenant/TenantPaymentsPage.tsx`
- Create: `frontend/src/pages/tenant/PayDuePage.tsx`
- Create: `frontend/src/pages/tenant/ReceiptPage.tsx`
- Create: `frontend/src/pages/tenant/TenantInquiriesPage.tsx`
- Create: `frontend/src/pages/tenant/tenant.module.css`
- Create: `frontend/src/pages/tenant/payment.test.tsx`
- Modify: `frontend/src/app/router.tsx`

**Interfaces:**
- Produces: `PayNowFlow` with steps `'review' | 'method' | 'confirmation'`, tenant routes, and durable receipt presentation.
- Consumes: current tenancy/due/payment repository data, `recordPayment`, shared formatters/UI, inquiry timeline, and workspace shell.

- [ ] **Step 1: Write failing tenant-priority and checkout tests**

```tsx
it('puts the next due amount and due date first on the tenant dashboard', async () => {
  renderApp({ route: '/tenant', role: 'tenant' });
  const due = await screen.findByRole('region', { name: 'Next payment due' });
  expect(within(due).getByText('₱18,000')).toBeVisible();
  expect(within(due).getByText('Sep 15, 2026')).toBeVisible();
});

it('completes a simulated payment and opens a durable receipt', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/tenant/payments/due-sep-2026/pay', role: 'tenant' });
  expect(await screen.findByText('Prototype payment simulation')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Choose payment method' }));
  await user.click(screen.getByRole('radio', { name: 'GCash demo' }));
  await user.click(screen.getByRole('button', { name: 'Review payment' }));
  await user.click(screen.getByRole('button', { name: 'Confirm simulated payment' }));
  expect(await screen.findByRole('heading', { name: 'Payment receipt' })).toBeVisible();
  expect(screen.getByText(/RD-2026-/)).toBeVisible();
});
```

- [ ] **Step 2: Run tests and confirm the red state**

Run: `npm run test:run -- src/pages/tenant/payment.test.tsx`

Expected: FAIL because the tenant pages and Pay Now flow do not exist.

- [ ] **Step 3: Implement tenant dashboard and current rental**

Dashboard renders the next actionable due first, followed by current rental, recent payments, landlord contact, and inquiry activity. CurrentRentalPage shows address, property/unit facts, tenancy period, payment schedule, amenities/rules, and contact action. Do not display irrelevant landlord operations.

- [ ] **Step 4: Implement payment list, three-step simulation, failure, and receipt**

TenantPaymentsPage separates current/upcoming dues from history. `PayNowFlow` always shows rental, billing period, due date, base amount, explicit `₱0` simulated fee, and total. Offer only fake methods such as “GCash demo” and “Bank transfer demo”; never request account numbers, OTPs, or card data. A deterministic “Simulate failure” control is available only in demo utilities and must show that no record was created. Success calls `recordPayment`, invalidates due/payment queries, navigates to the receipt ID, and shows reference, amount, Manila timestamp, method, and confirmed status.

- [ ] **Step 5: Implement tenant inquiries using the shared timeline**

Show the tenant's property context and conversation chronology. The compose action uses the same inquiry schema and offline guard as the marketplace flow.

- [ ] **Step 6: Run tenant tests and checks**

Run: `npm run test:run -- src/pages/tenant/payment.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 7: Commit if Git is available**

```bash
git add frontend/src/features/payment frontend/src/pages/tenant
git commit -m "feat: add tenant rental and simulated payment journey"
```

---

### Task 9: Add presentational authentication, settings, reset, and offline/PWA behavior

**Files:**
- Create: `frontend/src/pages/auth/SignInPage.tsx`
- Create: `frontend/src/pages/auth/RegisterPage.tsx`
- Create: `frontend/src/pages/SettingsPage.tsx`
- Create: `frontend/src/pages/OfflinePage.tsx`
- Create: `frontend/src/shared/hooks/useOnlineStatus.ts`
- Create: `frontend/src/features/demo-session/ResetDemoDataButton.tsx`
- Create: `frontend/src/pages/system.test.tsx`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/index.html`
- Modify: `frontend/src/app/router.tsx`
- Create: `frontend/public/icons/icon-192.png`
- Create: `frontend/public/icons/icon-512.png`
- Create: `frontend/public/icons/icon-maskable-512.png`

**Interfaces:**
- Produces: presentational auth routes, `useOnlineStatus(): boolean`, reset action, `/settings`, `/offline`, web manifest, and service worker registration.
- Consumes: user-supplied logo asset, demo repository reset, session role, shared forms/dialogs/feedback.

- [ ] **Step 1: Write failing truthful-system-state tests**

```tsx
it('labels authentication as a prototype and allows demo entry without collecting credentials', async () => {
  renderApp({ route: '/auth/sign-in' });
  expect(screen.getByText('Prototype sign-in')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Continue as tenant demo' })).toBeVisible();
});

it('blocks transactional actions offline with an explanation', async () => {
  setNavigatorOnline(false);
  renderApp({ route: '/tenant/payments/due-sep-2026/pay', role: 'tenant' });
  expect(await screen.findByText('Reconnect to continue this simulated payment')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Confirm simulated payment' })).toBeDisabled();
});

it('resets demo data only after explicit confirmation', async () => {
  const user = userEvent.setup();
  renderApp({ route: '/settings', role: 'landlord' });
  await user.click(screen.getByRole('button', { name: 'Reset demo data' }));
  expect(screen.getByRole('dialog', { name: 'Reset all prototype changes?' })).toBeVisible();
});
```

- [ ] **Step 2: Run tests and confirm the red state**

Run: `npm run test:run -- src/pages/system.test.tsx`

Expected: FAIL because the system pages and online hook do not exist.

- [ ] **Step 3: Implement auth/settings/offline pages and connectivity guard**

Auth pages demonstrate visual states and validation but do not accept or persist real credentials. Demo entry buttons set the selected role. Settings shows demo profile information, PWA information, and reset. Reset requires a named confirmation, calls `resetDemoData`, clears Query caches, returns to the role home, and announces completion. `useOnlineStatus` subscribes to browser `online`/`offline` events; mutation forms share an inline offline alert and disabled submission behavior.

- [ ] **Step 4: Configure the manifest and service worker**

Set manifest name `RentDito`, short name `RentDito`, `display: 'standalone'`, `theme_color: '#5B3FD6'`, and `background_color: '#F7F8FC'`. Cache the built shell and static visual assets. Use network-first behavior for navigations with `/offline` fallback and do not queue mutations. Generate 192px, 512px, and maskable 512px icons from the supplied logo without changing its violet identity; verify padding and visibility at small size.

Copy the user-supplied source asset to `frontend/public/logo.png` before generating icons. If the attachment is not exposed as a readable source file in the execution environment, stop this icon-generation step and request that exact asset file from the user; do not redraw or substitute the logo.

- [ ] **Step 5: Run system tests and production build**

Run: `npm run test:run -- src/pages/system.test.tsx`

Expected: all tests PASS.

Run: `npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0, the build reports generated PWA assets, and `dist/manifest.webmanifest` exists.

- [ ] **Step 6: Commit if Git is available**

```bash
git add frontend
git commit -m "feat: add prototype system pages and PWA support"
```

---

### Task 10: Add end-to-end journeys, accessibility checks, and responsive polish

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/marketplace.spec.ts`
- Create: `frontend/e2e/landlord.spec.ts`
- Create: `frontend/e2e/tenant-payment.spec.ts`
- Create: `frontend/e2e/responsive-a11y.spec.ts`
- Modify: focused page/component styles identified by test failures only

**Interfaces:**
- Produces: executable browser acceptance suite for the approved success criteria.
- Consumes: all routes and stable accessible labels from Tasks 1–9.

- [ ] **Step 1: Configure Playwright against the production preview server**

```ts
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1', port: 4173 },
  projects: [
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
});
```

Add `preview: "vite preview"` to `package.json`.

- [ ] **Step 2: Write the failing marketplace and landlord journeys**

```ts
test('guest inquiry and landlord unit status', async ({ page }) => {
  await page.goto('/listings?type=condominium');
  await page.getByRole('link', { name: /view .* details/i }).first().click();
  await page.getByRole('button', { name: 'Inquire about this property' }).click();
  await page.getByLabel('Message').fill('May I schedule a viewing this Saturday?');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByText('Inquiry saved in this prototype')).toBeVisible();

  await switchDemoRole(page, 'Landlord demo');
  await page.goto('/landlord/properties/prop-makati-01');
  await expect(page.getByRole('heading', { name: /property details/i })).toBeVisible();
});
```

- [ ] **Step 3: Write the failing tenant payment and receipt journey**

```ts
test('tenant completes the simulated Pay Now flow', async ({ page }) => {
  await page.goto('/tenant/payments/due-sep-2026/pay');
  await page.getByRole('button', { name: 'Choose payment method' }).click();
  await page.getByRole('radio', { name: 'GCash demo' }).check();
  await page.getByRole('button', { name: 'Review payment' }).click();
  await page.getByRole('button', { name: 'Confirm simulated payment' }).click();
  await expect(page.getByRole('heading', { name: 'Payment receipt' })).toBeVisible();
  await expect(page.getByText(/RD-2026-/)).toBeVisible();
});
```

- [ ] **Step 4: Write responsive and axe checks for representative routes**

For `/`, `/listings`, `/listings/prop-makati-01`, `/landlord`, `/landlord/properties`, `/tenant`, and `/tenant/payments`, inject axe and assert no serious or critical violations. At mobile width, assert the appropriate bottom navigation is visible, desktop sidebar is hidden, no horizontal document overflow exists, sticky actions do not cover the last focusable element, and all primary action bounding boxes are at least 44px high.

- [ ] **Step 5: Run end-to-end tests and confirm the red state**

Run: `npm run e2e`

Expected: at least one test FAILS before final responsive/accessibility corrections.

- [ ] **Step 6: Fix only evidenced journey, accessibility, and responsive defects**

Use the failing locator, axe finding, overflow measurement, or screenshot as the acceptance criterion. Preserve shared component contracts; fix shared causes in shared styles/components and page-specific composition issues in the relevant page module. Do not suppress axe rules without documenting a verified false positive in the test.

- [ ] **Step 7: Run the complete verification suite**

Run: `npm run test:run`

Expected: all unit and component tests PASS.

Run: `npm run e2e`

Expected: all journeys PASS in desktop and mobile Chromium projects.

Run: `npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0 and the PWA production build succeeds.

- [ ] **Step 8: Perform manual visual verification**

Inspect public home, search, listing detail, landlord overview/property detail, tenant overview/payment/receipt, settings, and offline pages at 390x844, 768x1024, and 1440x900. Confirm visual hierarchy, focus visibility, logo clarity, status legibility, skeleton stability, dialog/drawer focus, reduced motion, and absence of clipped or obscured content. Record any corrections in the task notes and rerun affected automated checks.

- [ ] **Step 9: Commit if Git is available**

```bash
git add frontend
git commit -m "test: verify RentDito prototype journeys and accessibility"
```

---

## Definition of Done

- Every route in the approved route inventory is navigable and visually consistent.
- Guest, landlord, and tenant core journeys pass automated tests with versioned persistent mock data.
- The simulated payment workflow is clearly labeled, collects no real financial credentials, supports success/failure, and produces a persistent receipt.
- Desktop sidebar, mobile bottom navigation, responsive tables/cards, filters, dialogs, and drawers behave accessibly.
- Empty, loading, validation, success, offline, and route error states are present and actionable.
- The PWA manifest, icons, service worker, installability, and offline fallback build successfully.
- Type checking, linting, unit/component tests, end-to-end tests, accessibility checks, and production build all pass.
- No backend files are changed.
