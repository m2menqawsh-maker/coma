# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Client-Heavy POS/ERP SPA on Next.js App Router with BaaS (Backend-as-a-Service via Supabase PostgreSQL), Client-Side Offline Caching & Sync Queue, and Database-Level Trigger Automation.
- Why this classification:
  - All page components in `src/app/` use `"use client"` and interact directly with Supabase via client-side PostgREST calls (`createBrowserClient`).
  - Business rules regarding ledger postings, inventory deductions, and audit logging are implemented as PostgreSQL stored triggers (`trg_invoice_to_ledger`, `trg_deduct_inventory`, `trg_log_invoice_activity`).
  - Network requests are intercepted at the client fetch layer to support offline caching and queuing mutations into `localStorage`.
- Primary constraints:
  - **Zero-downtime floor operations:** The system must continue operating (opening sessions, tracking time, taking cafe orders, checkout) even during internet outages.
  - **Financial integrity & Auditability:** Every invoice, payment, transfer, and expense must post to `ledger_entries` without double counting.
  - **Strict role-based access:** `viewer` (cashier), `partner`, and `admin` roles control visible data and managerial capabilities.

### 2) System Flow

```text
[User UI Action] -> [Client Supabase Call] -> [Offline Fetch Interceptor] -> [Supabase PostgreSQL] -> [DB Triggers & Views] -> [State & Cache Update]
```

Step-by-step trace of a representative flow (Session Checkout to General Ledger):

1. **Trigger & Input:** Cashier ends a session in `src/app/sessions/components/CheckoutModal.tsx` and submits checkout parameters.
2. **Calculation:** `calcSessionAmount` (`src/lib/finance/sessions.ts`) computes duration across device changes, and `calculateInvoiceTotals` (`src/lib/finance/invoices.ts`) computes total due, discount, credit applied, debt created, and gross profit.
3. **Dispatch & Interception:** `processSingleCheckout` (`src/app/sessions/actions/checkout.ts`) invokes Supabase client `.from("invoices").insert(...)`.
   - If online: The HTTP POST is sent to Supabase REST endpoint.
   - If offline: `createClient` fetch interceptor in `src/lib/supabase/client.ts` catches the offline state, saves the request payload into `localStorage["supabase_offline_queue"]`, dispatches `supabase_offline` event, and returns a synthetic 202 Accepted response.
4. **Database Processing & Side-Effects:**
   - In PostgreSQL, the `after_invoice_insert` trigger fires `trg_invoice_to_ledger()`, automatically generating entries in `ledger_entries` for cash, pending bank transfers, and customer debts (`schema.sql:16-49`).
   - The `after_invoice_item_insert` trigger fires `trg_deduct_inventory()`, decreasing raw item stock based on product recipe definitions.
   - The `invoice_activity_trigger` inserts a detailed record into `activity_logs`.
5. **Client Cache & UI Synchronization:**
   - On online success, `evictTableCache("invoices")` purges cached queries (`src/lib/supabase/cache.utils.ts`).
   - If offline, `OfflineSyncProvider` watches for connectivity restoration and flushes queued requests sequentially with the active session token (`src/components/OfflineSyncProvider.tsx:121-230`).

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| UI / Presentation (`src/app/**/page.tsx`, `components/`) | UI rendering, user interaction, form inputs, local modal states | Direct SQL manipulation, bypass of financial calculations | `src/app/sessions/page.tsx`, `src/components/AppLayout.tsx` |
| Finance Domain Logic (`src/lib/finance/`) | Deterministic calculation formulas for billing, hours, place costs, debt, and obligation amortizations | React state, direct API calls, storage access | `src/lib/finance/sessions.ts`, `src/lib/finance/invoices.ts` |
| Offline & Storage Engine (`src/lib/offline/`, `src/lib/supabase/cache.utils.ts`) | Connectivity heartbeat, request queue serialization, cache TTL and eviction, network failure recovery | UI layout, business calculation formulas | `src/lib/offline/offlineStateManager.ts`, `src/lib/supabase/cache.utils.ts` |
| Server API Routes (`src/app/api/`) | Administrative operations requiring secret keys (`SUPABASE_SERVICE_ROLE_KEY`) | Client UI logic, regular unprivileged CRUD operations | `src/app/api/users/route.ts` |
| Database Engine (`schema.sql`, PostgreSQL) | Relational persistence, constraints, triggers for ledger/inventory/audit, and security invoker views | Formatting presentation strings, browser UI state | `schema.sql`, `migrations/` |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| **Singleton State Manager** | `src/lib/offline/offlineStateManager.ts:335-342` | Ensures a single source of truth for online/offline connectivity, heartbeat timers, and queue length across all React components. |
| **Fetch Interceptor / Decorator** | `src/lib/supabase/client.ts:38-230` | Injects offline detection, request queuing, and localStorage query caching transparently underneath the standard `@supabase/supabase-js` client. |
| **Provider / React Context** | `src/components/OfflineSyncProvider.tsx`, `src/components/PrivacyProvider.tsx` | Distributes global application concerns (sync status banner, privacy blur toggle for numbers) throughout the component tree. |
| **Snapshot Accounting** | `src/app/sessions/actions/checkout.ts:106-123`, `src/app/closing/components/ClosingWizard.tsx:160` | Captures financial rates, partner share percentages, and cost rates at transaction time so future price changes do not distort historical records. |

### 5) Known Architectural Risks

- **Misconfigured Edge Middleware:** The auth guard logic in `src/proxy.ts` is named `proxy.ts` rather than `src/middleware.ts`, which prevents Next.js from automatically registering it as edge middleware. Route guarding currently relies on client-side checks in `AppLayout.tsx`.
- **Offline Mutation Conflict Resolution:** Mutations queued offline are replayed in chronological order without optimistic locking or conflict resolution headers (e.g. `If-Match`), risking silent overwrites if two devices edit the same record offline.
- **Client-Side Financial Actions:** Critical flows like multi-table balance adjustments and closing validations execute from client browser code rather than server-side transactional RPCs (PostgreSQL `BEGIN...COMMIT`), meaning client connection drops mid-batch could cause partial transactions.
- **Unenforced Period Locks:** `period_locks` entries are inserted during financial closing, but no PostgreSQL RLS policy or trigger currently checks `period_locks` to prohibit retroactively adding invoices or expenses to locked historical dates.

### 6) Evidence

- `src/lib/supabase/client.ts`
- `src/lib/offline/offlineStateManager.ts`
- `src/components/OfflineSyncProvider.tsx`
- `src/app/sessions/actions/checkout.ts`
- `src/app/closing/components/ClosingWizard.tsx`
- `src/proxy.ts`
- `schema.sql`

## Extended Sections (Optional)

### Offline Sync Engine Lifecycle

1. **Heartbeat Monitoring:** `OfflineStateManager` runs a `HEAD` request to `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?limit=1` every 5 seconds with a 2-second timeout (`offlineStateManager.ts:76-136`).
2. **Failure Threshold:** 2 consecutive heartbeat failures flag the system as `offline`, setting `window.forceOfflineMode = true` and dispatching `supabase_offline`.
3. **Queue Ingestion:** Any `POST`, `PATCH`, or `DELETE` executed via `createClient()` while offline is wrapped into an envelope (`{ id, url, method, headers, body, timestamp }`) and persisted to `localStorage["supabase_offline_queue"]`.
4. **Auto-Recovery:** When network connectivity is confirmed, `OfflineSyncProvider` iterates through the queue, re-authorizes requests with the current user's session token, submits requests to Supabase, removes successful requests, and evicts cached query tables.
