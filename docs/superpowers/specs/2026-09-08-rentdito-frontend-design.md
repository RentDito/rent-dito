# RentDito Frontend Prototype Design

**Date:** 2026-09-08  
**Status:** Approved in conversation; awaiting written-spec review  
**Scope:** Frontend-only, navigable PWA prototype with realistic local mock data

## 1. Product intent

RentDito combines two related products in one coherent experience:

1. A public rental marketplace where people can browse, save, and inquire about properties.
2. A property-management workspace where landlords manage properties, units, tenants, inquiries, and rent payments, while tenants track their current rental, dues, receipts, and inquiries.

The prototype must establish a reusable visual and interaction system for the entire product. It should feel professional, modern, friendly, highly legible, responsive, accessible, and difficult to misuse. It uses Philippine market conventions, English-first copy, Philippine peso currency, and realistic local addresses. All data and transactions are simulated in the frontend.

## 2. Success criteria

The prototype succeeds when a reviewer can:

- Browse and filter realistic rental listings as a guest.
- Open a listing, understand its key terms, save it, and submit an inquiry.
- Switch into landlord or tenant demo states without authenticating.
- Understand the landlord portfolio's occupancy, expected rent, collected rent, overdue balances, vacancies, and inquiry workload at a glance.
- Manage properties and units, inspect tenant records, update unit status, and record or confirm payments through simulated workflows.
- Understand a tenant's current rental, next due amount and date, payment history, and inquiry activity at a glance.
- Complete a simulated tenant payment flow and reach a clear receipt state.
- Navigate and complete primary workflows on mobile, tablet, and desktop without inconsistent controls or page-specific visual rules.
- Install the prototype as a PWA and receive a useful, honest offline experience.

The prototype does not connect to a backend, authenticate real users, process real payments, send real messages, upload files to a server, or make claims about actual transaction completion.

## 3. Chosen experience model

RentDito uses a **unified adaptive platform**. A single design system and application shell support three experiences while allowing each context to use the right information density.

### 3.1 Public marketplace

Public pages use a lightweight top navigation and image-led layouts. They include:

- Home and discovery
- Search results with filters and sorting
- Property details and gallery
- Saved listings
- Inquiry composition and confirmation
- Sign-in and onboarding presentation

### 3.2 Landlord workspace

The landlord area prioritizes operational clarity and includes:

- Overview dashboard
- Properties and nested units
- Tenants and tenant detail
- Payments, balances, and confirmation workflows
- Inquiries and inquiry detail
- Profile and settings

The overview highlights occupancy, expected rent, collected rent, overdue payments, vacant units, and open inquiries.

### 3.3 Tenant workspace

The tenant area prioritizes the next required action and includes:

- Overview dashboard
- Current rental and rental details
- Dues and payment history
- Simulated Pay Now checkout and receipt
- Inquiries
- Saved listings
- Profile and settings

The next due amount and due date are the most prominent dashboard information, followed by current rental details, recent payments, and landlord contact.

### 3.4 Demo role switching

A discreet demo-only role switcher exposes guest, landlord, and tenant states. It is controlled by prototype configuration and is not part of the production navigation contract. In a production implementation, the authenticated account determines accessible workspaces and navigation.

## 4. Responsive shell and navigation

### 4.1 Desktop

- Public pages use a brand header with discovery navigation, saved listings, and account actions.
- Authenticated workspaces use a collapsible left sidebar, a persistent top bar, breadcrumbs, and a focused main content region.
- Page headers contain a title, concise supporting context, and at most one visually dominant primary action.

### 4.2 Mobile

- Public pages use a compact top bar, prominent search access, and touch-friendly filter sheets.
- Workspaces use a compact top bar and role-specific bottom navigation for high-frequency destinations.
- Secondary filters, actions, and detail controls move into drawers, bottom sheets, or contextual menus.
- Bottom navigation remains limited to the most important destinations; lower-frequency pages live under a More or profile destination.

### 4.3 Responsive content behavior

- Wide-screen record tables become stacked, labeled record cards on small screens.
- Filter rails become drawers without changing filter meaning or state.
- Multi-column summaries collapse in priority order rather than simply shrinking.
- All primary touch targets are at least 44 by 44 CSS pixels.
- Persistent actions must not cover page content or conflict with mobile safe areas.

## 5. Visual design system

The visual identity takes its accent from the supplied violet RentDito logo. The experience balances a welcoming marketplace with a calm, data-focused management product.

### 5.1 Core colors

| Token | Value | Purpose |
|---|---:|---|
| Brand primary | `#5B3FD6` | Primary actions, active navigation, selected controls |
| Brand deep | `#3720A5` | Strong emphasis, pressed states, high-contrast brand surfaces |
| Brand soft | `#F1EEFF` | Selected backgrounds, highlighted cards, subtle brand surfaces |
| Text primary | `#18202B` | Headings and primary body copy |
| Text secondary | `#667085` | Supporting copy and metadata |
| Canvas | `#F7F8FC` | Application background |
| Surface | `#FFFFFF` | Cards, menus, dialogs, and fields |
| Success | `#16865B` | Paid, occupied, completed, and positive outcomes |
| Warning | `#B86A00` | Due soon, pending review, and caution states |
| Error | `#C63F4A` | Overdue, failed, destructive, and blocking states |
| Information | `#2563EB` | Informational states and neutral notices |

Each semantic color receives lighter background and darker text variants derived as design tokens. Status communication never relies on color alone; it includes a readable label and, when useful, an icon.

### 5.2 Typography

- Use Inter Variable across the interface.
- Use a restrained, tokenized scale for display, page title, section title, body, supporting text, label, and caption roles.
- Default body text must remain at least 16px on content-heavy mobile screens; compact metadata may use 13–14px when contrast and line height remain sufficient.
- Use weight and spacing for hierarchy before introducing additional color.
- Use tabular numerals for payment amounts and KPI values where supported.

### 5.3 Shape, elevation, and spacing

- Use a consistent spacing scale based on 4px increments.
- Cards and large controls use 14–18px radii; smaller nested elements use proportionally smaller tokenized radii.
- Shadows remain subtle and are reserved for elevation, menus, floating surfaces, and hover affordance.
- Borders and background contrast establish most grouping so dashboards do not look visually heavy.
- Content widths and gutters use layout tokens shared by public and workspace pages.

### 5.4 Motion

- Standard transitions use 120ms, 180ms, or 240ms durations depending on interaction size.
- Motion is limited to opacity, color, and small transforms that do not trigger layout jumps.
- Loading skeletons preserve final content dimensions.
- Route changes avoid theatrical page transitions.
- The interface respects `prefers-reduced-motion` and removes nonessential animation.

### 5.5 Logo use

- Use the provided logo on light or deliberately high-contrast neutral surfaces.
- Produce consistent full-mark, compact-mark, favicon, and PWA icon treatments from the supplied asset during implementation.
- Maintain clear space around the mark and do not recolor it with unrelated semantic status colors.

## 6. Idiot-proof interaction principles

- Give every page a clear purpose, a dominant next action, and descriptive labels.
- Keep primary actions in predictable positions and avoid multiple competing primary buttons.
- Use plain-language form labels, short examples, inline validation, and specific recovery instructions.
- Explain destructive consequences before confirmation and name the affected record.
- Preserve entered data after recoverable errors.
- Make empty states explain why no records appear and provide one useful next action.
- Show payment amount, due date, unit, tenant or landlord, and status together wherever a payment decision occurs.
- Distinguish recorded, pending, confirmed, failed, and overdue states explicitly.
- Use progressive disclosure for advanced filters and infrequent settings.
- Pair icon-only controls with accessible names and visible tooltips on pointer devices.
- Maintain WCAG AA contrast, visible keyboard focus, semantic landmarks, logical heading order, and screen-reader status announcements.

## 7. Page patterns and key workflows

### 7.1 Marketplace home

The home page includes a prominent location/property search, quick property-type chips, trust cues, featured listings, and a concise explanation of how RentDito works. It avoids an oversized decorative hero that pushes listings below the fold.

### 7.2 Search results

- Responsive property-card grid
- Search query summary and result count
- Location, price, property type, bedrooms, amenities, furnishing, and availability filters
- Sorting with a clear default
- Desktop filter rail and mobile filter drawer sharing the same state
- Applied-filter chips with individual and clear-all controls
- Empty and no-match recovery paths

### 7.3 Property details

The page prioritizes gallery, monthly rent, location, availability, property/unit facts, key amenities, description, rules, landlord verification cues, and one persistent Inquire action. Mobile keeps the primary action reachable without obscuring content. Inquiry composition confirms which property and unit the message concerns.

### 7.4 Management list pages

Management pages follow a consistent sequence:

1. Page header and primary action
2. Urgent or useful summary metrics
3. Search, filtering, and sorting
4. Responsive records
5. Pagination or an explicit result boundary
6. Loading, empty, error, and success states

### 7.5 Landlord property and unit management

Properties act as parent records and units remain inspectable and editable in context. Unit statuses include available, occupied, reserved, unavailable, and maintenance. Status changes show their operational consequence and require confirmation when they could affect an active tenancy.

### 7.6 Tenant payment flow

The simulated checkout is deliberately short:

1. Review the rental, billing period, due date, base amount, and simulated fees.
2. Select a mock payment method and review the total.
3. Confirm the simulated payment.
4. Show a durable receipt view with reference number, amount, time, method, and resulting status.

The interface labels the flow as a prototype simulation. It does not collect or mimic complete real card or bank credentials. A simulated failure path explains that no payment was recorded and offers a retry.

## 8. Shared component system

The shared UI layer contains composable, accessible primitives rather than page-specific copies:

- Buttons, icon buttons, links, and action groups
- Text fields, text areas, currency inputs, selects, comboboxes, checkboxes, radios, and date controls
- Form field wrapper with label, hint, validation, and required state
- Badges and status chips
- Tabs, segmented controls, breadcrumbs, pagination, and bottom navigation
- Cards, property cards, KPI cards, record cards, and detail groups
- Tables with responsive record-card presentation
- Dialogs, confirmation dialogs, drawers, bottom sheets, menus, and tooltips
- Toasts, banners, inline alerts, empty states, skeletons, and error states
- Currency, date, address, occupancy, and payment-status display components
- Gallery, avatar, image placeholder, and file placeholder components
- Timelines for inquiries, tenancy events, and payments

Components expose consistent states for default, hover, focus-visible, active, selected, disabled, loading, invalid, and success. Mobile and desktop presentations share contracts and behavior even when their layouts differ.

## 9. Clean frontend architecture

### 9.1 Technology

- React with TypeScript
- Vite build tooling
- React Router for route composition
- TanStack Query for asynchronous server-state semantics and mutation lifecycles, even when backed by local mock repositories
- React Hook Form with Zod schemas for accessible forms and validation
- A token-based CSS system using CSS custom properties and modular component styles
- A Vite-compatible PWA integration for manifest and service worker generation

Dependencies should be kept minimal. Motion should use CSS transitions unless a verified interaction genuinely needs a dedicated animation library.

### 9.2 Dependency direction

The source tree follows this high-level dependency direction:

```text
app -> pages -> features -> entities -> shared
```

- `app`: bootstrap, providers, routing, shell selection, PWA integration, and prototype configuration
- `pages`: route composition only; pages coordinate feature components but contain no repository implementation
- `features`: user actions and use cases such as search listings, submit inquiry, update unit status, and pay due
- `entities`: domain types, status rules, and entity-focused presentation
- `shared`: design tokens, UI primitives, generic hooks, utilities, formatting, and infrastructure interfaces

Feature modules may define repository contracts near their domain use cases. Infrastructure adapters implement those contracts and are wired at the app composition boundary. Lower layers never import pages or application routing.

### 9.3 Data flow

```text
Route page -> feature hook/use case -> repository contract -> local mock adapter
                                                    |
                                                    -> future API adapter
```

Pages do not import seed data directly. The mock adapter introduces small, believable delays, supports explicit success and failure scenarios, and persists prototype mutations in browser storage. Seed data has a versioned reset mechanism so reviewers can restore the original demo state.

Mock data includes multiple Philippine locations, property types, landlords, properties, units, tenants, tenancies, inquiries, payment schedules, payments, and notification examples. Relationships use stable identifiers and satisfy domain invariants.

## 10. PWA and offline behavior

- Provide an installable web app manifest with RentDito name, theme color, background color, display mode, and branded icon set.
- Cache the application shell and safe static assets.
- Allow previously loaded non-sensitive demo content to render when practical.
- Show a useful offline route when requested content is unavailable.
- Display connection state when it materially changes what the user can do.
- Never present an offline inquiry, unit mutation, or payment action as completed unless it is deliberately modeled as queued and visibly labeled. The initial prototype disables those mutations offline and explains why.
- Account for mobile safe areas and standalone display mode in fixed navigation.

## 11. Loading, empty, error, and feedback states

Three levels of error handling are used:

1. **Field level:** specific validation beside the affected input.
2. **Section level:** recoverable data or mutation error with a retry or corrective action.
3. **Route level:** friendly error boundary with navigation back to a safe destination.

Success toasts provide lightweight confirmation, but important outcomes also remain visible in page content. Skeletons reflect the approximate final layout. Empty states distinguish a genuinely empty account from filters that produce no matches.

## 12. Prototype route inventory

The implementation plan should include at least these navigable routes:

```text
/
/listings
/listings/:listingId
/saved
/auth/sign-in
/auth/register
/landlord
/landlord/properties
/landlord/properties/:propertyId
/landlord/tenants
/landlord/tenants/:tenantId
/landlord/payments
/landlord/inquiries
/tenant
/tenant/rental
/tenant/payments
/tenant/payments/:dueId/pay
/tenant/receipts/:paymentId
/tenant/inquiries
/settings
/offline
```

Authentication pages are presentational in this frontend-only prototype. Demo role switching provides access to seeded authenticated states.

## 13. Verification strategy

### 13.1 Unit tests

- Currency and date formatting
- Payment and occupancy status mapping
- Due-state and overdue calculations
- Repository-backed use cases
- Mock persistence reset and version behavior

### 13.2 Component and integration tests

- Form labels, validation, error recovery, and focus management
- Dialog and drawer keyboard behavior
- Desktop sidebar and mobile bottom navigation
- Filter synchronization between responsive presentations
- Unit status mutation and resulting feedback
- Simulated checkout success and failure states
- Reduced-motion and accessible status announcements

### 13.3 End-to-end journeys

- Guest searches, filters, opens a listing, saves it, and submits an inquiry.
- Landlord inspects dashboard risks, opens a property, and changes a unit status.
- Landlord reviews a tenant balance and confirms a simulated payment.
- Tenant reviews a due, completes simulated Pay Now, and opens the receipt.
- Reviewer switches roles and restores demo data.
- Primary journeys work at representative mobile and desktop viewports.

### 13.4 Build and quality gates

- Type checking
- Linting
- Unit and component tests
- End-to-end smoke tests
- Automated accessibility checks on representative pages
- Production build
- PWA manifest and service-worker validation
- Manual responsive review at mobile, tablet, and desktop widths

## 14. Explicit non-goals

- Backend or database implementation
- Real authentication or authorization
- Real payment processing or collection of financial credentials
- Real-time messaging, email, SMS, or push delivery
- Server-side image upload or document storage
- Accounting, tax, lease generation, maintenance ticketing, or advanced analytics
- A complete admin/back-office product
- Production security, legal, or regulatory claims based on the mock prototype

These can become later, independently designed increments. The prototype should preserve adapter and feature boundaries that make those increments possible without prematurely implementing them.

