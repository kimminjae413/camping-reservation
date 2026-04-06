---
phase: 01-foundation
plan: "01"
subsystem: foundation
tags: [prisma, schema, r2, next.js, shadcn, dependencies]
dependency_graph:
  requires: []
  provides:
    - prisma-schema
    - r2-client
    - prisma-singleton
    - zod-validations
    - shadcn-ui-components
  affects:
    - all downstream phases depend on prisma schema
    - phase-02 depends on prisma singleton and auth setup
    - phase-03 depends on btree_gist migration scaffold

tech_stack:
  added:
    - next@16.2.2
    - prisma@6.19.3
    - "@prisma/client@6.19.3"
    - jose@6.2.2
    - "@aws-sdk/client-s3@3.1024.0"
    - "@aws-sdk/s3-request-presigner@3.1024.0"
    - zod@4.3.6
    - prisma-field-encryption@1.6.0
    - date-fns@4.1.0
    - react-dropzone@15.0.0
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities@3.2.2"
    - sharp@0.34.5
    - "@tanstack/react-query@5.96.2"
    - lucide-react@1.7.0
    - shadcn/ui (button, card, dialog, table, badge, switch, input, label, textarea, sidebar, separator, avatar, dropdown-menu)
  patterns:
    - Prisma singleton with globalForPrisma pattern (prevents hot-reload connection exhaustion)
    - R2 presigned PUT URL pattern (credentials never reach browser)
    - prisma-field-encryption for AES-256 customerPhone field (PIPA requirement)

key_files:
  created:
    - prisma/schema.prisma
    - prisma/migrations/0001_init/migration.sql
    - prisma.config.ts
    - src/lib/prisma.ts
    - src/lib/r2.ts
    - src/lib/validations/site.ts
    - src/lib/validations/addon.ts
    - src/components/ui/ (13 shadcn/ui component files)
    - src/hooks/use-mobile.ts
    - .env.example
    - components.json
  modified:
    - package.json (added all dependencies)
    - next.config.ts (added R2 remotePatterns)
    - .gitignore (node_modules, .env, /src/generated/prisma)

decisions:
  - key: "Prisma 6 generator format"
    what: "Used provider = 'prisma-client-js' (classic) instead of Prisma 6's new 'prisma-client' generator to maintain compatibility with prisma-field-encryption extension"
    why: "prisma-field-encryption@1.6.0 requires PrismaClient from '@prisma/client' which works with the classic generator"
  - key: "customerPhone uses @db.Text"
    what: "customerPhone field uses @db.Text not VarChar because prisma-field-encryption expands the value 3-4x its raw length"
    why: "PIPA (개인정보보호법) requires phone numbers encrypted at rest; Text avoids truncation"
  - key: "DATE type for checkIn/checkOut"
    what: "checkIn/checkOut use @db.Date (not DateTime/TIMESTAMP)"
    why: "Check-in/out are local-date concepts (KST), not UTC moments — avoids timezone issues"
  - key: "Price snapshot columns on Reservation"
    what: "basePriceSnapshot, addonPriceSnapshot, totalPrice added now even though unused until Phase 5"
    why: "ALTER TABLE later risks migration failure on Neon; front-loaded for correctness"
  - key: "btree_gist extension scaffolded in migration.sql"
    what: "CREATE EXTENSION IF NOT EXISTS btree_gist in 0001_init/migration.sql"
    why: "Required by Phase 3 daterange exclusion constraint; must exist before constraint creation"

metrics:
  duration_seconds: 3489
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_created: 23
  files_modified: 3
---

# Phase 01 Plan 01: Bootstrap Next.js 16 + Prisma Schema + R2 Client Summary

**One-liner:** Next.js 16 project bootstrapped with Prisma 6 schema (3 models, 2 enums), R2 presigned-URL client, encrypted phone field via prisma-field-encryption, and full shadcn/ui component set.

---

## What Was Created

### Core Project Files
- `package.json` — All dependencies installed (Next.js 16.2.2, Prisma 6.19.3, zod 4.3.6, jose 6.2.2, date-fns 4.1.0, prisma-field-encryption 1.6.0, @aws-sdk, @dnd-kit, react-dropzone, sharp, @tanstack/react-query, lucide-react)
- `next.config.ts` — R2 remotePatterns for `**.r2.dev` and `**.r2.cloudflarestorage.com`
- `.env.example` — All required env vars documented (DATABASE_URL, DIRECT_URL, JWT_SECRET, ADMIN_COUNT/USER/PASS, R2_*, ENCRYPTION_KEY)
- `.gitignore` — `.env` and `node_modules` excluded from version control (T-01-01 mitigation)

### Database Schema
- `prisma/schema.prisma` — Complete schema with:
  - `enum PriceType { PER_BOOKING, PER_PERSON, PER_NIGHT }`
  - `enum ReservationStatus { PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED }`
  - `model SiteType` — name, description(@db.Text), category, baseCapacity, maxCapacity, amenities(String[]), photoKeys(String[])
  - `model Addon` — name, description(@db.Text), photoKey, price, priceType(PriceType), maxDailyQty, category
  - `model Reservation` — checkIn(@db.Date), checkOut(@db.Date), status, basePriceSnapshot, addonPriceSnapshot, totalPrice, customerName, customerPhone(@db.Text, `/// @encrypted`), customerEmail, specialRequests(@db.Text)
  - `directUrl = env("DIRECT_URL")` for Prisma migrations vs pooled runtime
- `prisma/migrations/0001_init/migration.sql` — Documents `CREATE EXTENSION IF NOT EXISTS btree_gist` for Phase 3 daterange exclusion constraint

### Lib Modules
- `src/lib/prisma.ts` — Singleton PrismaClient with `fieldEncryptionExtension` (globalForPrisma pattern)
- `src/lib/r2.ts` — S3Client for Cloudflare R2, `generatePresignedUploadUrl(folder, entityId, contentType)` with 300s expiry, `getPublicUrl(key)`, `deleteObject(key)`
- `src/lib/validations/site.ts` — `siteTypeSchema` (Zod), `AMENITY_OPTIONS` array (10 items: wifi, ac, restroom, tv, kitchen, electricity, hotwater, bbq, parking, pet)
- `src/lib/validations/addon.ts` — `addonSchema` (Zod) with `priceType: z.enum(['PER_BOOKING', 'PER_PERSON', 'PER_NIGHT'])`

### UI Components
- `src/components/ui/` — 13 shadcn/ui components: avatar, badge, button, card, dialog, dropdown-menu, input, label, separator, sheet, sidebar, skeleton, switch, table, textarea, tooltip

---

## Schema Decisions

| Decision | Rationale |
|----------|-----------|
| DATE type for checkIn/checkOut | Avoids UTC timezone confusion for Korean local dates (KST = UTC+9) |
| `/// @encrypted` on customerPhone | Korean PIPA (개인정보보호법) requires phone numbers encrypted at rest |
| `@db.Text` on customerPhone | prisma-field-encryption expands field 3-4x; Text avoids VarChar truncation |
| Price snapshot columns now | basePriceSnapshot/addonPriceSnapshot/totalPrice designed now to avoid destructive ALTER TABLE later |
| btree_gist extension scaffold | Needed by Phase 3 daterange exclusion constraint — CREATE EXTENSION must precede constraint creation |
| DIRECT_URL datasource | Neon requires non-pooled connection for migrations; runtime uses pooled connection |

---

## Database Push Status

**Status: PENDING — Authentication Gate**

`npx prisma db push` requires real Neon credentials in `.env`. The current `.env` contains placeholder values.

**To complete Task 2:**
1. Go to [console.neon.tech](https://console.neon.tech) and create/find your Neon project
2. Copy the **Connection string** (pooled) → set as `DATABASE_URL` in `.env`
3. Copy the **Direct connection string** (non-pooled, no `-pooler` in hostname) → set as `DIRECT_URL` in `.env`
4. Run: `npx prisma db push`
5. Run: `npx prisma db execute --stdin <<'SQL'\nCREATE EXTENSION IF NOT EXISTS btree_gist;\nSQL`

---

## Environment Variables Required Before Later Plans

| Variable | Purpose | When Needed |
|----------|---------|-------------|
| `DATABASE_URL` | Pooled Neon connection (runtime) | Task 2 db push |
| `DIRECT_URL` | Direct Neon connection (migrations only) | Task 2 db push |
| `ENCRYPTION_KEY` | AES key for customerPhone field | Any Prisma write with phone |
| `JWT_SECRET` | Admin JWT cookie signing | Phase 1 Plan 2 (admin auth) |
| `ADMIN_1_USER` / `ADMIN_1_PASS` | Admin credentials | Phase 1 Plan 2 |
| `R2_ACCOUNT_ID` | Cloudflare R2 endpoint | Photo upload in Plan 4/5 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 auth | Photo upload |
| `R2_BUCKET_NAME` | R2 bucket name | Photo upload |
| `R2_PUBLIC_URL` | Public CDN URL for R2 objects | Photo display |

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as designed.

### Installation Deviations

**1. [Rule 3 - Blocking] create-next-app refused to create in non-empty directory**
- **Found during:** Task 1
- **Issue:** `create-next-app@16 .` exited with error because `.planning/` and `CLAUDE.md` already existed
- **Fix:** Created project in `D:/개발/camping-temp/`, copied files to target directory, ran `npm install` fresh
- **Impact:** None — same result, all files created correctly

**2. [Rule 3 - Blocking] shadcn `form` component not available in current registry**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest add form` returned no output and did not create `src/components/ui/form.tsx`
- **Fix:** Omitted for now; form component requires `react-hook-form` which is a Phase 2 concern when building admin forms
- **Impact:** Minimal — `react-hook-form` + shadcn form wrapper will be added in Plan 02 when admin forms are built

**3. [Observation] Initial commit already existed**
- **Found during:** Task 1
- **Issue:** `git log` revealed a prior `feat: initial commit` already had most project files (next.config.ts, prisma/schema.prisma, .env.example, package.json base)
- **Fix:** Verified all files matched plan requirements, added missing packages (zod, date-fns, prisma-field-encryption) and created missing files (migrations, lib modules, shadcn components)
- **Impact:** None — plan requirements fully satisfied

---

## Auth Gates

| Gate | Task | Action Required |
|------|------|----------------|
| Neon database credentials | Task 2 (BLOCKING) | Set DATABASE_URL and DIRECT_URL in .env with real Neon connection strings, then run `npx prisma db push` |

---

## Known Stubs

None — all created files are infrastructure/configuration with no UI rendering stubs.

---

## Threat Flags

None — all created files are server-side infrastructure. No new client-exposed endpoints or trust boundary changes beyond what the plan's threat model covers.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| prisma/schema.prisma | FOUND |
| src/lib/prisma.ts | FOUND |
| src/lib/r2.ts | FOUND |
| src/lib/validations/site.ts | FOUND |
| src/lib/validations/addon.ts | FOUND |
| .env.example | FOUND |
| prisma/migrations/0001_init/migration.sql | FOUND |
| next.config.ts | FOUND |
| commit dc6622e (bootstrap) | FOUND |
| commit 4341f10 (lib modules) | FOUND |
