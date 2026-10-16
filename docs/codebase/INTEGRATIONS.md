# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|---------------------------|---------|------------|-------------|----------|
| **Supabase PostgREST** | REST API / Database Gateway | Primary data layer for all CRUD operations, tables, and views | Bearer JWT (Anon key / User access token) | Critical | `src/lib/supabase/client.ts`, `schema.sql` |
| **Supabase Auth (GoTrue)** | Auth Service | Email/password user authentication and session management | Password & Refresh token in cookies / headers | Critical | `src/app/login/page.tsx`, `src/lib/supabase/server.ts` |
| **Supabase Admin API** | Privileged Admin API | Creating auth accounts and setting roles programmatically | `SUPABASE_SERVICE_ROLE_KEY` | High | `src/app/api/users/route.ts:19-24` |
| **Palestine Banking & Payment Providers** (PalPay, JawwalPay, BOP, ISBK) | Financial / Manual Verification | Tracking customer wire transfers and payment channels into business accounts | Manual verification via cashier & bank reconciliation | Medium | `schema.sql:283-290`, `src/app/banks/types.ts:7` |
| **PWA Service Worker** | Local Cache & Worker | Caches static assets and scripts for offline browser execution | Local browser worker APIs | High | `next.config.ts:2-13`, `public/icon-192x192.png` |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| **Supabase PostgreSQL** | Primary relational database hosting all business entities, views, triggers, and audit logs | `@supabase/supabase-js` / PostgREST REST endpoints | Outages disconnect live sync; unhandled schema migration drift | `schema.sql`, `src/lib/supabase/client.ts` |
| **Browser `localStorage`** | Offline request queue (`supabase_offline_queue`) and table query cache (`supabase_cache_*`) | Web Storage API via `cache.utils.ts` and `offlineStateManager.ts` | Browser storage quota exceeded (5-10MB limit); data wiped by user | `src/lib/supabase/cache.utils.ts`, `src/lib/offline/offlineStateManager.ts` |
| **HTTP Cookies** | Supabase session tokens and authentication state | Next.js Server Actions / `@supabase/ssr` cookie handler | Token expiry during offline usage | `src/lib/supabase/server.ts`, `src/proxy.ts` |

### 3) Secrets and Credentials Handling

- Credential sources:
  - Client public keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Server private keys: `SUPABASE_SERVICE_ROLE_KEY`.
  - Loaded via environment variables (`.env.local`).
- Hardcoding checks:
  - Clean: No API keys, passwords, or service role secrets hardcoded in source files. Checked via codebase scan and grep.
- Rotation or lifecycle notes:
  - If `SUPABASE_SERVICE_ROLE_KEY` is rotated, update the host environment variables. Client anon key rotation requires rebuilding the Next.js bundle.

### 4) Reliability and Failure Behavior

- Retry/backoff behavior:
  - Mutation requests caught while offline or failing network timeouts are pushed to `supabase_offline_queue`.
  - Periodic background sync loop in `OfflineSyncProvider` attempts queue flush every 10 seconds or immediately upon `online` and `supabase_online` events (`src/components/OfflineSyncProvider.tsx:273-277`).
- Timeout policy:
  - Client-side fetch timeout is set to 10,000ms (10 seconds) via `AbortController` in `src/lib/supabase/client.ts:81, 148`.
  - Heartbeat checks timeout after 2,000ms (2 seconds) in `src/lib/offline/offlineStateManager.ts:93`.
- Circuit-breaker or fallback behavior:
  - `forceOfflineMode` flag automatically activates for 10 seconds after network error bursts to prevent spamming failed HTTP requests (`src/lib/supabase/client.ts:97, 169`).
  - Cache fallback: If a GET query fails while offline and table is marked for permanent caching (`shouldCacheForever`), returns cached JSON or graceful empty array `[]` instead of throwing fatal errors.

### 5) Observability for Integrations

- Logging around external calls:
  - Errors logged to browser console via `console.error` and `console.warn` (`Failed to sync offline request`, `Network error during mutation`).
- Metrics/tracing coverage:
  - Real-time event bus (`window.dispatchEvent` with custom events: `status_changed`, `queue_updated`, `sync_started`, `sync_completed`, `supabase_offline`, `supabase_online`).
  - Toast banner displayed at bottom of screen when offline or syncing with count of pending offline mutations (`src/components/OfflineSyncProvider.tsx:298-317`).
- Missing visibility gaps:
  - [TODO] No centralized external error logging or APM service (e.g. Sentry, Datadog) currently integrated. Unhandled client sync failures stay in user browser console.

### 6) Evidence

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/cache.utils.ts`
- `src/lib/offline/offlineStateManager.ts`
- `src/components/OfflineSyncProvider.tsx`
- `src/app/api/users/route.ts`
- `schema.sql`
