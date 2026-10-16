# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files (React Components) | PascalCase with `.tsx` | `CheckoutModal.tsx`, `AppLayout.tsx`, `DailyTab.tsx` | `src/components/`, `src/app/**/components/` |
| Files (Utilities / Modules) | camelCase with `.ts` or dot-qualifiers | `exportCsv.ts`, `cache.utils.ts`, `invoices.ts` | `src/lib/` |
| Files (Tests) | `*.test.ts`, `*.test.tsx`, `*.spec.ts` | `invoices.test.ts`, `1-auth.spec.ts` | `src/**/__tests__/`, `e2e/tests/` |
| Functions & methods | camelCase descriptive verbs | `calculateInvoiceTotals`, `calcSessionAmount`, `handleConfirm` | `src/lib/finance/`, `src/app/banks/components/BanksManager.tsx` |
| Types & interfaces | PascalCase nouns | `InvoiceTotalsInput`, `SessionOrder`, `PricingConfig`, `BankAccountDetail` | `src/app/sessions/types.ts`, `src/lib/finance/invoices.ts` |
| Database tables & columns | snake_case | `session_device_changes`, `customer_debt_payments`, `total_due` | `schema.sql`, `migrations/` |
| Constants / Enums | UPPER_SNAKE_CASE or camelCase mappings | `DAYS_IN_PERIOD`, `EXPENSE_TYPE_LABELS`, `ACTION_LABELS` | `src/lib/finance/obligations.ts:3`, `src/app/tracking/page.tsx:21` |

### 2) Formatting and Linting

- Formatter: Biome & Prettier/ESLint configs (`biome.json`, `.eslintrc.json`, `eslint.config.mjs`).
  - Indentation: Tabs (`useTabs: true` in Biome / editor configuration).
  - Quotes: Double quotes (`"..."`).
  - Semicolons: Semicolons enforced.
- Linter: ESLint 9 with `eslint-config-next` and Biome linter.
- Most relevant enforced rules:
  - TypeScript strict mode enabled (`"strict": true` in `tsconfig.json:7`).
  - Accessibility warnings relaxed for high-speed POS interfaces (`biome.json:6-12`: `useButtonType: off`, `noAutofocus: off`).
  - Non-null assertion allowed where schema guarantees value (`biome.json:19`).
- Run commands:
  ```bash
  npm run lint
  ```

### 3) Import and Module Conventions

- Import grouping/order:
  1. Built-in Node.js modules (e.g. `import path from "node:path"`).
  2. Third-party packages (e.g. `import { useState, useEffect } from "react"`, `import toast from "react-hot-toast"`).
  3. Internal aliased modules using `@/` path alias (e.g. `import { createClient } from "@/lib/supabase/client"`, `import AppLayout from "@/components/AppLayout"`).
  4. Local feature imports (e.g. `./types`, `./utils`, `./components/*`).
- Alias vs relative import policy:
  - Root imports always use `@/` pointing to `src/*` (`tsconfig.json:22`). Relative imports (`./` or `../`) are used strictly within local feature folders.
- Public exports/barrel policy:
  - Explicit named exports are preferred for utilities and types (`export function calcCost`, `export type Device`). Default exports are reserved for Next.js pages and top-level layout components.

### 4) Error and Logging Conventions

- Error strategy by layer:
  - UI layer: User-facing toast notifications using `react-hot-toast` in Arabic (e.g. `toast.error("خطأ أثناء إنشاء الاشتراك: " + error.message)`).
  - Data / Service layer: Throws standard JavaScript `Error` with descriptive message (e.g. `throw new Error("فشل إنشاء الفاتورة: " + invoiceError.message)`).
  - Network / Offline layer: Graceful degradation returning synthetic 202 status for offline queued mutations or empty array fallback for permanently cached tables (`src/lib/supabase/client.ts:133-140`).
- Logging style:
  - `console.error` and `console.warn` used for caught integration failures. Dev-mode lock noise is actively suppressed (`OfflineSyncProvider.tsx:71`).
- Sensitive-data redaction:
  - Privacy mode toggle (`PrivacyProvider`) dynamically adds `.privacy-blur` CSS classes to financial balances and revenues on screen when staff need to conceal revenue from customers.

### 5) Testing Conventions

- Test file naming/location rule:
  - Unit tests co-located in `__tests__/` subdirectories matching source (e.g., `src/lib/finance/__tests__/invoices.test.ts`).
  - E2E tests organized in `e2e/tests/` numbered sequentially by workflow (e.g., `1-auth.spec.ts`, `2-sessions.spec.ts`).
- Mocking strategy norm:
  - Browser APIs (`localStorage`, `window.addEventListener`, `fetch`, `navigator.onLine`) mocked via JSDOM and Vitest `vi.fn()` (`vitest.setup.ts`, `src/lib/supabase/__tests__/client.test.ts`).
  - E2E tests run against a live dev server with test database setup and cleanup scripts (`e2e/global-setup.ts`, `e2e/cleanup.ts`).
- Coverage expectation:
  - Coverage command: `npm run test:coverage`. Unit tests focus heavily on zero-tolerance financial arithmetic (`invoices.ts`, `sessions.ts`, `obligations.ts`).

### 6) Evidence

- `biome.json`
- `tsconfig.json`
- `vitest.config.ts`
- `vitest.setup.ts`
- `playwright.config.ts`
- `src/lib/finance/invoices.ts`
- `src/components/PrivacyProvider.tsx`
- `src/app/sessions/actions/checkout.ts`
