# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| **High** | Route-guard middleware is not recognized by Next.js | `src/proxy.ts:4, 48` (named `proxy.ts` and exports `proxy` instead of standard `src/middleware.ts` with `middleware` export) | Server-side unauthorized route access isn't blocked by Next.js middleware; client-side route redirection in `AppLayout.tsx` can be bypassed by direct API queries. | Rename `src/proxy.ts` to `src/middleware.ts` and export `async function middleware(request: NextRequest)`. |
| **High** | Period locks not enforced at the database or RLS level | `src/app/closing/components/ClosingWizard.tsx:173`, `schema.sql:4414` (`period_locks` table exists but has no trigger or RLS check on `invoices`/`expenses`) | Users could backdate or modify invoices or expenses within a period that was already closed and distributed to partners. | Implement a PostgreSQL `BEFORE INSERT OR UPDATE` trigger on `invoices` and `expenses` validating `NEW.session_end` / `NEW.date` is not strictly earlier than `MAX(locked_until)`. |
| **Med** | Unhandled concurrent conflict in offline mutations | `src/lib/supabase/client.ts:60-70`, `src/lib/offline/offlineStateManager.ts:238-250` | If two cashiers work offline simultaneously on the same entities, the second flush overwrites the first without optimistic concurrency checks. | Add versioning/timestamp checks (`updated_at` or ETags) and alert the cashier if a remote record changed during offline state. |
| **Med** | Missing dependencies in local environment | `node_modules` directory does not exist; running tests without `npm install` fails | Commands cannot be executed until dependencies are restored. | Run `npm install` in the workspace environment. |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Client-heavy financial multi-step operations | Initial prototype speed without dedicated Supabase SQL RPCs | `src/app/sessions/actions/checkout.ts`, `src/app/inventory/actions/inventory.ts` | Network interruption between consecutive REST calls could leave partial state (e.g. invoice inserted but session delete failed). | Refactor checkout into a single atomic PostgreSQL stored procedure (`RPC: checkout_session(...)`). |
| Redundant table name extraction logic | Helper duplicated in multiple files | `src/lib/supabase/client.ts:16-19` and `src/lib/supabase/cache.utils.ts:11-14` | Inconsistent URL parsing or divergence if PostgREST routes change. | Centralize `getTableNameFromUrl` into `cache.utils.ts` and export for reuse. |
| Duplicated Supabase client instantiation | Both `createClient()` and raw instances scattered across component files | `src/app/closing/page.tsx:12`, `src/app/tracking/page.tsx:8` | Multiple client instances in browser memory instead of single shared instance. | Consistently use singleton `createClient()` from `@/lib/supabase/client`. |

### 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Public anon key RLS dependencies | A01: Broken Access Control | `schema.sql:7104` (`CREATE POLICY "Enable all for authenticated" ON public.period_locks TO authenticated USING (true)`) | Supabase RLS is enabled on all tables | Policies primarily grant full access to any authenticated user; fine-grained role checks (`user_profiles.role = 'admin'`) are often enforced in frontend React UI rather than PostgreSQL RLS policies. |
| Insecure user creation endpoint without server auth verification | A01: Broken Access Control | `src/app/api/users/route.ts:4-35` | Requires `SUPABASE_SERVICE_ROLE_KEY` to execute | The route handler does not verify that the calling client is an authenticated `admin` before creating new accounts. Anyone with network access to `/api/users` could POST user accounts if key is active. Add server-side session check `(await supabase.auth.getUser()).role === 'admin'`. |
| Secrets exposed if `.env` committed | A05: Security Misconfiguration | `.gitignore` | `.gitignore` contains `.env*.local` rules | Verify `.env` is never committed to GitHub. |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Pre-fetching 2,000 customers into `localStorage` | `src/components/OfflineSyncProvider.tsx:96-102` | Fetches large JSON payload on client boot | Exceeds localStorage 5MB quota as customer count exceeds thousands. | Migrate offline customer search cache to `IndexedDB` with pagination and debounced search. |
| Client-side date filtering on unindexed columns | `src/app/page.tsx:188-198`, `src/app/closing/components/ClosingWizard.tsx:64-74` | Loops through array in browser JS | Slower page loads as multi-year invoice records accumulate. | Push aggregations down to PostgreSQL RPCs or SQL views. |
| Unbounded `limit(500)` bank transfers | `src/app/banks/components/BanksManager.tsx:62` | Fetches 500 rows at once | Memory pressure on mobile POS devices. | Implement virtualized list and server-side cursor pagination. |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `src/app/sessions/actions/checkout.ts` | Handles multi-table side effects (invoice, invoice_items, subscriptions, customers, debts, ledger, bank transfers, session delete). | Top complexity in codebase (490 lines, 13.9KB). | Run `npm run test:e2e` after any change to checkout logic; write unit tests for each discount/overpay edge case. |
| `src/lib/supabase/client.ts` | Custom fetch wrapper that intercepts every network call for offline routing, JSON caching, and synthetic responses. | Unstaged changes in working tree; central core of entire offline engine. | Exercise with `e2e/tests/7-offline-sync.spec.ts` and `src/lib/supabase/__tests__/client.test.ts`. |
| `src/app/closing/components/ClosingWizard.tsx` | Multi-step financial wizard computing deductions, obligations, and partner dividends. | High financial impact on real-world partner payouts. | Verify all mathematical outputs against manual spreadsheets; keep automated calculation pure in `src/lib/finance/`. |

### 6) `[ASK USER]` Questions

1. [ASK USER] Should `src/proxy.ts` be renamed to `src/middleware.ts` so that Next.js automatically executes edge middleware to protect routes for unauthenticated users?
2. [ASK USER] Should database-level period locking triggers be implemented to strictly block retrospective modifications to locked financial periods?
3. [ASK USER] Should the user-creation API endpoint (`src/app/api/users/route.ts`) enforce an admin-session check to prevent unauthorized user creation?
4. [ASK USER] Would you like `npm install` run now to enable direct test execution and linters in this environment?

### 7) Evidence

- `src/proxy.ts`
- `src/app/api/users/route.ts`
- `src/app/closing/components/ClosingWizard.tsx`
- `src/lib/supabase/client.ts`
- `src/components/OfflineSyncProvider.tsx`
- `schema.sql`
- `docs/codebase/.codebase-scan.txt`
