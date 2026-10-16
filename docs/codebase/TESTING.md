# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Vitest (`vitest: ^4.1.8`) for unit & component tests; Playwright (`@playwright/test: ^1.60.0`) for end-to-end tests.
- Assertion/mocking tools: `@testing-library/react: ^16.3.2`, `@testing-library/jest-dom: ^6.9.1`, Vitest built-in `vi.mock` / `vi.fn()`, Playwright browser fixtures.
- Commands:

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with code coverage report
npm run test:coverage

# Run all Playwright E2E tests headless
npm run test:e2e

# Run Playwright E2E tests with interactive UI
npm run test:e2e:ui
```

### 2) Test Layout

- Test file placement pattern:
  - Unit tests: Co-located in `__tests__/` folders adjacent to the tested module (e.g. `src/lib/finance/__tests__/invoices.test.ts`, `src/components/__tests__/OfflineSyncProvider.test.tsx`).
  - E2E tests: Located in `e2e/tests/` numbered sequentially to represent end-to-end user journeys (e.g., `1-auth.spec.ts`, `2-sessions.spec.ts` ... `12-subscriptions-packages.spec.ts`).
- Naming convention:
  - Unit tests: `*.test.ts` and `*.test.tsx`.
  - E2E specs: `*.spec.ts`.
- Setup files:
  - Vitest setup: `vitest.setup.ts` (configures JSDOM environment, mocks `window.matchMedia`, `IntersectionObserver`, and crypto).
  - Playwright setup: `e2e/global-setup.ts` (initializes authenticated state and saves to `e2e/storageState.json`), `e2e/cleanup.ts` (teardown script).

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit (Finance) | Yes | `src/lib/finance/*.ts` (`invoices.ts`, `sessions.ts`, `obligations.ts`) | Strict mathematical assertions on billing rates, device switching, debt calculations, rounding, and gross profit. |
| Unit (Components) | Yes | `DoubleConfirmModal.test.tsx`, `OfflineSyncProvider.test.tsx` | Verifies modal confirmation flows, event subscription/unsubscription, and offline provider state transitions. |
| Integration (Client) | Yes | `src/lib/supabase/__tests__/client.test.ts` | Validates fetch interceptor behavior, localStorage queue serialization, and caching triggers. |
| E2E (Full Journey) | Yes | 13 test suites under `e2e/tests/` | Complete operational flows: login, floor sessions, cafeteria orders, invoicing, bank reconciliation, inventory purchase & recipes, closings, offline sync, obligations, partners, and subscriptions. |

### 4) Mocking and Isolation Strategy

- Main mocking approach:
  - Unit tests mock the Supabase client (`createClient`), localStorage, and fetch network responses to isolate calculation and React rendering.
  - E2E tests run against a real running Next.js dev server (`baseURL: "http://localhost:3000"` in `playwright.config.ts:13`) with database fixtures and cleanup hooks.
- Isolation guarantees:
  - Vitest runs tests in isolated JSDOM environments, resetting mocks in `beforeEach` / `afterEach`.
  - Playwright uses pre-authenticated browser context saved in `e2e/storageState.json` to bypass repetitive login actions.
  - Workers forced to 1 in `playwright.config.ts:8` (`workers: 1`) to ensure deterministic database state execution without race conditions on dev servers.
- Common failure mode:
  - Tests relying on live Supabase endpoints fail if `NEXT_PUBLIC_SUPABASE_URL` is unreachable or `.env.local` is missing.

### 5) Coverage and Quality Signals

- Coverage tool + threshold: Vitest v8 coverage provider (`@vitest/coverage-v8`), run via `npm run test:coverage`. Thresholds: [TODO] (no hard failure threshold currently enforced in `vitest.config.ts`).
- Current reported coverage: [TODO] (requires installing `node_modules` and executing full coverage run).
- Known test suite strengths:
  - Exhaustive E2E coverage across 12 distinct functional domains matching the complete business workflow.
  - Dedicated unit tests for offline cache manager and storage queue.

### 6) Evidence

- `vitest.config.ts`
- `vitest.setup.ts`
- `playwright.config.ts`
- `e2e/global-setup.ts`
- `e2e/helpers.ts`
- `src/lib/finance/__tests__/invoices.test.ts`
- `src/lib/supabase/__tests__/client.test.ts`
- `src/components/__tests__/OfflineSyncProvider.test.tsx`
