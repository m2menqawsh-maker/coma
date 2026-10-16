# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript 5.x | `package.json:306`, `tsconfig.json:1-34` |
| Runtime + version | Node.js (current environment: v26.7.0, target: Node.js 20+ / ES2017) | `package.json:295` (`@types/node: ^20`), `tsconfig.json:3` |
| Package manager | npm (lockfileVersion 3) | `package-lock.json:183`, `package.json` |
| Module/build system | Next.js 16.2.0 (Webpack / Turbopack support enabled), React 19.2.4 | `next.config.ts:15-19`, `package.json:193-195` |

### 2) Production Frameworks and Dependencies

List only high-impact production dependencies (frameworks, data, transport, auth).

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| `next` | `16.2.0` | React web framework, App Router, SSR, Edge runtime | `package.json:193` |
| `react` / `react-dom` | `19.2.4` | Core UI library with React 19 hooks and compiler | `package.json:194-195`, `next.config.ts:17` |
| `@supabase/supabase-js` | `^2.99.2` | Supabase client for database operations, auth, and realtime | `package.json:192`, `src/lib/supabase/client.ts` |
| `@supabase/ssr` | `^0.9.0` | Server-side Supabase authentication and cookie handling | `package.json:191`, `src/lib/supabase/server.ts`, `src/proxy.ts` |
| `@ducanh2912/next-pwa` | `^10.2.9` | Progressive Web App (PWA) offline service worker and caching | `package.json:190`, `next.config.ts:2-13` |
| `recharts` | `^3.8.1` | Data visualization and business analytics charts | `package.json:197`, `src/components/DashboardChart.tsx` |
| `react-hot-toast` | `^2.6.0` | UI notification alerts | `package.json:196`, `src/components/AppLayout.tsx:5` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| `typescript` | Static type checking and compiler | `package.json:306`, `tsconfig.json` |
| `vitest` | Unit and component test runner | `package.json:307`, `vitest.config.ts` |
| `@playwright/test` | End-to-end (E2E) browser testing framework | `package.json:200`, `playwright.config.ts` |
| `@testing-library/react` | React component testing utilities | `package.json:204` |
| `tailwindcss` (v4) / `@tailwindcss/postcss` | Utility-first styling framework | `package.json:201, 215`, `src/app/globals.css` |
| `eslint` / `eslint-config-next` | Linting engine | `package.json:212-213`, `eslint.config.mjs`, `.eslintrc.json` |
| `biome` | High-performance linter and code standard analyzer | `biome.json:1-33` |
| `babel-plugin-react-compiler` | Automatic memoization compiler for React 19 | `package.json:299`, `next.config.ts:17` |

### 4) Key Commands

```bash
# Install dependencies
npm install

# Run local development server (binds to 0.0.0.0:3000)
npm run dev

# Build application for production (using Next.js webpack build)
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit test coverage
npm run test:coverage

# Run end-to-end integration tests with Playwright
npm run test:e2e
```

### 5) Environment and Config

- Config sources: `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `biome.json`, `.eslintrc.json`, `eslint.config.mjs`.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`: Public endpoint for the Supabase instance (`src/lib/supabase/client.ts:39`, `src/app/api/users/route.ts:6`).
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous API key for client-side queries (`src/lib/supabase/client.ts:40`).
  - `SUPABASE_SERVICE_ROLE_KEY`: Privileged service key required on backend API route to provision auth users (`src/app/api/users/route.ts:7`).
  - Optional / CI: `NODE_ENV`, `CI`.
- Deployment/runtime constraints:
  - Requires active Supabase project with PostgreSQL schemas, custom types, views, and triggers (`schema.sql`).
  - Requires PWA support in browser for full offline capabilities.
  - Node.js runtime supporting Next.js 16 (Node 20+).

### 6) Evidence

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `biome.json`
- `src/lib/supabase/client.ts`
- `src/app/api/users/route.ts`
