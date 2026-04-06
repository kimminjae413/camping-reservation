# Phase 1: Foundation - Research

**Researched:** 2026-04-06
**Domain:** Next.js 16 App Router + Prisma 6 + Neon PostgreSQL + Cloudflare R2 + Auth.js v5 Credentials + shadcn/ui admin panel
**Confidence:** HIGH (core stack verified via npm registry 2026-04-06; auth strategy patterns verified via web search)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Admin login uses environment-variable-based fixed credentials (username/password in .env), not a database user table
- **D-02:** 2-3명의 소규모 관리자, 각 관리자별 env 변수로 관리 (ADMIN_1_USER, ADMIN_1_PASS 등)
- **D-03:** Session management via httpOnly cookie with JWT. Unauthenticated requests to /admin/* return 401
- **D-04:** No customer-facing auth in this phase (customers use reservation number + phone)
- **D-05:** Latest/modern admin panel style with camping-themed warm tones (forest green, earth brown, warm beige accents)
- **D-06:** shadcn/ui component library as the base design system
- **D-07:** Sidebar navigation layout with collapsible menu (dashboard, sites, add-ons, reservations, customers, reviews, settings)
- **D-08:** Dark/light mode not required for v1
- **D-09:** Amenities input via predefined checklist (WiFi, 에어컨, 화장실, TV, 취사시설, 전기, 온수, 바베큐장, 주차, 반려동물 등)
- **D-10:** Photo upload via drag-and-drop with drag-to-reorder functionality
- **D-11:** Site type form: name, description (rich text), category, base capacity, max capacity, photos, amenities checklist, status (active/inactive)
- **D-12:** Add-on form: name, description, photo, price, price type (건당/인당/박당), max daily quantity, category, active/inactive toggle
- **D-13:** Add-on list shows activation status with toggle switch for quick enable/disable
- **D-14:** PostgreSQL hosted on Neon (serverless, Prisma-compatible)
- **D-15:** File storage on Cloudflare R2 (S3-compatible, zero egress cost)
- **D-16:** Schema includes price-snapshot columns on reservations table (designed now, used later)
- **D-17:** DATE type for check-in/check-out (not TIMESTAMP — avoids timezone issues)
- **D-18:** Phone field encrypted at rest
- **D-19:** Range exclusion constraint scaffolding for double-booking prevention (constraint created, used in Phase 3)

### Claude's Discretion
- Exact sidebar menu icons and hover states
- Admin login page visual design
- Rich text editor choice for site description
- Cloudflare R2 bucket naming and folder structure
- Prisma schema field naming conventions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SITE-01 | 관리자가 객실 유형(글램핑, 오토캠핑, 카라반 등)을 등록/수정/삭제할 수 있다 | Admin CRUD API pattern via Next.js Route Handlers + Prisma; SiteType model defined below |
| SITE-02 | 관리자가 객실별 사진, 설명, 수용인원, 편의시설을 관리할 수 있다 | R2 presigned upload pattern; amenities checklist as string array; photo ordering via JSON array of R2 keys |
| ADDON-01 | 관리자가 부대시설 항목(이름, 가격, 사진, 수량, 가격유형)을 등록/수정할 수 있다 | Addon model with PriceType enum; same R2 upload pattern as site photos |
| ADDON-02 | 관리자가 부대시설 항목을 활성화/비활성화할 수 있다 | Toggle PATCH endpoint; isActive boolean on Addon model |
| ADDON-04 | 부대시설 가격유형을 지원한다 (건당/인당/박당) | PriceType enum: PER_BOOKING / PER_PERSON / PER_NIGHT |
</phase_requirements>

---

## Summary

Phase 1 establishes the full project skeleton: Next.js 16 (latest stable as of Apr 2026), Prisma 6 ORM with PostgreSQL on Neon, admin authentication via env-based credentials and JWT cookies, site type CRUD with photo upload to Cloudflare R2, and add-on management. This is a greenfield project — no migration from existing code.

The key implementation complexity in this phase falls into three areas: (1) the Prisma schema must be designed correctly for downstream requirements (price snapshot columns, DATE types, encrypted phone, exclusion constraint scaffold), (2) the R2 photo upload must use a server-side presigned URL pattern to keep R2 credentials off the client, and (3) the admin auth must use a custom JWT cookie pattern since Auth.js v5 is still in beta and env-based credentials without a database adapter is a specific use case that needs careful implementation.

The schema work is especially forward-looking: columns for price snapshots, the `btree_gist` extension, and the exclusion constraint on the reservations table must be created now even though they are not exercised until Phase 3. Doing this in Phase 1 avoids destructive migration pain later.

**Primary recommendation:** Use Next.js 16 + Prisma 6 + custom JWT cookie auth (jose library, no Auth.js) + R2 presigned URLs via `@aws-sdk/client-s3` + dnd-kit for drag-to-reorder photos + shadcn/ui Sidebar component for admin navigation.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.2 | Full-stack framework | Latest stable; Turbopack default; React 19.2; confirmed via npm registry 2026-04-06 |
| react | 19.2.4 | UI library | Ships with Next.js 16; Server Components reduce client bundle |
| typescript | 5.8.3 (via next) | Type safety | next.config.ts natively supported in Next.js 15+ |
| prisma | 6.6.0 | ORM + migration tooling | Best-in-class TS DX; migrate dev for schema evolution |
| @prisma/client | 6.6.0 | Database client | Auto-generated types match schema exactly |
| tailwindcss | 4.2.2 | Utility CSS | CSS-first config (no tailwind.config.js); ships with create-next-app |
| shadcn/ui | latest (CLI) | Admin UI components | Tailwind v4 + React 19 compatible; copy-paste, no lock-in |

[VERIFIED: npm registry 2026-04-06]

### Authentication

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| jose | 6.2.2 | JWT sign/verify | Industry-standard Web Crypto API wrapper; no Auth.js v5 dependency |

**Auth.js v5 status:** As of npm registry check (2026-04-06), `next-auth` latest tag is still `4.24.13` and v5 is at `5.0.0-beta.30` under the `beta` tag. [VERIFIED: npm registry]. Web search confirms Auth.js v5 is actively documented and used with credentials provider through 2026, but since the locked decision is env-based credentials (no database adapter), using `jose` directly for JWT cookie issuance/verification is simpler and more appropriate than pulling in Auth.js for a use case it is not optimized for (env vars, not DB users). [CITED: https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg]

### File Storage

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @aws-sdk/client-s3 | 3.1024.0 | R2 bucket operations | S3-compatible; official SDK for presigned URL generation |
| @aws-sdk/s3-request-presigner | 3.1024.0 | Presigned PUT URLs | Client uploads directly to R2; credentials never reach browser |
| sharp | 0.34.5 | Server-side image resize | Enforce max dimensions + WebP conversion before presigned URL flow |

[VERIFIED: npm registry 2026-04-06]

### Drag-and-Drop (Photo Upload + Reorder)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-dropzone | 15.0.0 | File drop zone UI | Headless; hooks-based; works with shadcn card layout |
| @dnd-kit/core | 6.3.1 | Drag-to-reorder engine | Lightweight; accessible; works with RSC hydration boundaries |
| @dnd-kit/sortable | 10.0.0 | Sortable list abstraction | Built on dnd-kit/core; handles photo grid ordering |
| @dnd-kit/utilities | 3.2.2 | CSS transform helpers | Required by sortable |

[VERIFIED: npm registry 2026-04-06]

### Data / Encryption

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| zod | 4.3.6 | Schema validation | Type-safe form/API validation; works with Next.js Server Actions |
| prisma-field-encryption | 1.6.0 | Transparent AES encryption for Prisma fields | Encrypts phone number at DB level; `/// @encrypted` annotation in schema |
| date-fns | 4.1.0 | Date utilities | No timezone surprises for DATE-type operations |

[VERIFIED: npm registry 2026-04-06]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.96.2 | Server state cache | Client-side admin table data fetching with cache invalidation |
| lucide-react | 1.7.0 | Icon library | Default icon set for shadcn/ui |
| tw-animate-css | (via shadcn) | CSS animations | Replaced tailwindcss-animate in shadcn for Tailwind v4 |

[VERIFIED: npm registry 2026-04-06]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose (custom JWT) | Auth.js v5 beta | Auth.js v5 adds dependency weight; env-based credentials without DB adapter is niche; jose is simpler and explicit |
| react-dropzone + dnd-kit | react-beautiful-dnd | react-beautiful-dnd is unmaintained; dnd-kit is the maintained successor |
| prisma-field-encryption | Manual encrypt/decrypt in service layer | Manual approach is error-prone; prisma-field-encryption handles key rotation |
| sharp (server resize) | Client-side canvas resize | Server-side ensures consistent quality; prevents huge uploads hitting R2 |

**Installation:**
```bash
# 1. Create project
npx create-next-app@latest camping-site \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# 2. Prisma
npm install prisma@6 @prisma/client@6
npx prisma init --datasource-provider postgresql

# 3. shadcn/ui (interactive — choose New York style, zinc base color)
npx shadcn@latest init
npx shadcn@latest add button card dialog table form badge switch input label textarea sidebar separator avatar dropdown-menu

# 4. Auth + storage
npm install jose @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# 5. File handling
npm install react-dropzone @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities sharp

# 6. Data + encryption
npm install zod prisma-field-encryption date-fns @tanstack/react-query

# 7. Types
npm install -D @types/node
```

**Version verification:** All versions confirmed against npm registry on 2026-04-06.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Admin shell: sidebar + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── sites/
│   │   │   │   ├── page.tsx        # Site type list
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   └── addons/
│   │   │       ├── page.tsx        # Add-on list
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/edit/page.tsx
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST: verify env creds, issue JWT cookie
│   │   │   └── logout/route.ts     # POST: clear cookie
│   │   ├── upload/
│   │   │   └── presigned/route.ts  # POST: return presigned PUT URL for R2
│   │   └── admin/
│   │       ├── sites/
│   │       │   └── route.ts        # GET list, POST create
│   │       │   └── [id]/route.ts   # GET, PUT, DELETE
│   │       └── addons/
│   │           └── route.ts        # GET list, POST create
│   │           └── [id]/route.ts   # GET, PATCH (toggle), PUT, DELETE
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn copy-pasted components
│   ├── admin/
│   │   ├── AppSidebar.tsx          # shadcn Sidebar wrapper
│   │   ├── SiteTypeForm.tsx
│   │   ├── AddonForm.tsx
│   │   └── PhotoUploader.tsx       # react-dropzone + dnd-kit
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # JWT cookie helpers (jose)
│   ├── r2.ts                       # R2 client + presigned URL generator
│   ├── middleware-auth.ts          # requireAdmin() helper
│   └── validations/
│       ├── site.ts                 # Zod schemas for site type
│       └── addon.ts                # Zod schemas for add-on
├── middleware.ts                   # Next.js edge middleware: protect /admin/*
└── prisma/
    ├── schema.prisma
    └── migrations/
        └── 0001_init/
            └── migration.sql       # Includes manual btree_gist + exclusion constraint
```

### Pattern 1: Env-Based Admin Auth with JWT Cookie (jose)

**What:** Admin credentials stored in `.env` as `ADMIN_1_USER` / `ADMIN_1_PASS`. On login, compare against env vars, sign a JWT with jose, set it as httpOnly Secure cookie. Middleware validates the JWT on every `/admin/*` request.

**When to use:** Small fixed admin set (2-3 users) with no need for a user management UI. Simpler than Auth.js for this use case.

```typescript
// src/lib/auth.ts
// Source: jose docs + project decision D-01/D-03
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'admin_session'

export async function signAdminToken(username: string) {
  return new SignJWT({ username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET)
  return payload
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    return await verifyAdminToken(token)
  } catch {
    return null
  }
}
```

```typescript
// src/middleware.ts — protects /admin/* at edge
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next()
  }
  const token = req.cookies.get('admin_session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

**CRITICAL:** API routes under `/api/admin/*` must ALSO call `requireAdmin()` server-side — middleware alone is bypass-able via direct curl. [CITED: PITFALLS.md Pitfall 8]

### Pattern 2: Multi-Admin Credential Lookup

**What:** Support 2-3 admins without a database. Env vars are indexed.

```typescript
// src/lib/auth.ts
export function verifyAdminCredentials(username: string, password: string): boolean {
  const adminCount = parseInt(process.env.ADMIN_COUNT ?? '1')
  for (let i = 1; i <= adminCount; i++) {
    if (
      process.env[`ADMIN_${i}_USER`] === username &&
      process.env[`ADMIN_${i}_PASS`] === password
    ) {
      return true
    }
  }
  return false
}
```

### Pattern 3: R2 Presigned Upload Flow

**What:** Server generates a short-lived PUT URL, client uploads directly to R2, server receives the final R2 key after upload completes.

**Why:** R2 credentials never reach the browser. [CITED: https://developers.cloudflare.com/r2/api/s3/presigned-urls/]

```typescript
// src/lib/r2.ts — Source: Cloudflare R2 docs + aws-sdk-js-v3 examples
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function generatePresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  // URL expires in 5 minutes — enough for admin upload
  return getSignedUrl(r2, command, { expiresIn: 300 })
}
```

**Upload flow:**
1. Client calls `POST /api/upload/presigned` with `{ filename, contentType }`
2. Server generates presigned PUT URL, returns `{ uploadUrl, key }`
3. Client `PUT`s the file binary directly to the presigned URL (no auth header needed)
4. Client reports `key` back to form state; saved to DB on form submit

**R2 folder structure (discretion):**
```
camping-media/
├── sites/{siteTypeId}/{uuid}.webp
└── addons/{addonId}/{uuid}.webp
```

### Pattern 4: Drag-to-Reorder Photo Grid

**What:** Photos upload into a sortable grid. Drag to reorder. Order stored as JSON array of R2 keys on the SiteType record.

```typescript
// components/admin/PhotoUploader.tsx (simplified structure)
// Source: dnd-kit docs (https://docs.dndkit.com)
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDropzone } from 'react-dropzone'

// Photos are stored as: { key: string (R2 key), url: string (public URL) }[]
// On drag end: setPhotos(arrayMove(photos, oldIndex, newIndex))
// Persisted to form as JSON array
```

### Pattern 5: Prisma Schema with Forward-Looking Columns

**What:** Schema includes columns needed for Phase 2+ that are not yet used in Phase 1. Correct now = no destructive migration later.

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = []
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Neon: required for prisma migrate
}

// ─── ENUMS ─────────────────────────────────────────────────────────────────

enum PriceType {
  PER_BOOKING  // 건당
  PER_PERSON   // 인당
  PER_NIGHT    // 박당
}

enum ReservationStatus {
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  COMPLETED
}

// ─── SITE TYPE ─────────────────────────────────────────────────────────────

model SiteType {
  id           String   @id @default(cuid())
  name         String
  description  String   @db.Text
  category     String
  baseCapacity Int
  maxCapacity  Int
  amenities    String[] // Array of amenity keys: ["wifi", "ac", "bbq", ...]
  photoKeys    String[] // Ordered array of R2 object keys
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Phase 2+: one SiteType has many concrete Site units
  // Site        Site[]

  @@map("site_types")
}

// ─── ADD-ON ─────────────────────────────────────────────────────────────────

model Addon {
  id             String    @id @default(cuid())
  name           String
  description    String    @db.Text
  photoKey       String?   // R2 object key
  price          Int       // In KRW (won), no decimals
  priceType      PriceType
  maxDailyQty    Int       // Max units bookable per day
  category       String?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("addons")
}

// ─── RESERVATION (scaffold for Phase 3) ────────────────────────────────────

model Reservation {
  id               String            @id @default(cuid())
  // siteId        String            // Phase 3
  checkIn          DateTime          @db.Date  // DATE type — KST local date
  checkOut         DateTime          @db.Date  // DATE type — KST local date
  status           ReservationStatus @default(PENDING_PAYMENT)

  // Price snapshot columns (D-16): values captured at booking time
  // Phase 2 will populate these — columns exist now to avoid ALTER TABLE later
  basePriceSnapshot    Int?    // Total base accommodation price at booking time
  addonPriceSnapshot   Int?    // Total add-on price at booking time
  totalPrice           Int?    // basePriceSnapshot + addonPriceSnapshot

  // Customer PII (D-18): encrypted at rest via prisma-field-encryption
  customerName         String?
  customerPhone        String? /// @encrypted  — prisma-field-encryption annotation
  customerEmail        String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("reservations")
}
```

**Exclusion constraint scaffold (D-19):** Prisma does not natively generate `EXCLUDE USING` constraints. Add via raw SQL in the migration file. [VERIFIED: github.com/prisma/prisma/issues/17514]

```sql
-- In prisma/migrations/0001_init/migration.sql (appended after Prisma-generated DDL)

-- Enable btree_gist extension required for exclusion constraints on date ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion constraint: prevent overlapping reservations for same site
-- NOTE: siteId column added in Phase 3. This scaffolds the extension only.
-- The actual constraint will be added in the Phase 3 migration.
-- Documenting here so Phase 3 knows what to add:
--   ALTER TABLE reservations
--     ADD CONSTRAINT no_overlap
--     EXCLUDE USING gist (
--       site_id WITH =,
--       daterange(check_in, check_out, '[)') WITH &&
--     );
```

### Pattern 6: Neon + Prisma Connection Configuration

**What:** Neon requires two URLs — pooled connection for runtime, direct connection for `prisma migrate`.

[CITED: https://neon.com/docs/guides/prisma]

```env
# .env
# Pooled connection (via PgBouncer) — used by Prisma Client at runtime
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/camping?sslmode=require"

# Direct connection — used only by prisma migrate / prisma db push
DIRECT_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/camping?sslmode=require"

# Admin auth
JWT_SECRET="generate-with-openssl-rand-base64-32"
ADMIN_COUNT=2
ADMIN_1_USER=admin1
ADMIN_1_PASS=change-this-in-production
ADMIN_2_USER=admin2
ADMIN_2_PASS=change-this-in-production

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=camping-media
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### Anti-Patterns to Avoid

- **Client-side auth guard only:** Always validate JWT server-side in Route Handlers — middleware is not sufficient alone. [CITED: PITFALLS.md Pitfall 8]
- **Storing R2 credentials client-side:** Use presigned URL pattern; never pass R2 keys to the browser.
- **TIMESTAMP for check-in/check-out:** Use `@db.Date`. [CITED: PITFALLS.md Pitfall 6, D-17]
- **Saving raw DSLR photos:** Resize and convert to WebP with `sharp` on the server before storing in R2. [CITED: PITFALLS.md Pitfall 14]
- **Skipping btree_gist now:** Adding it in Phase 3 requires a migration that may fail if data exists. Enable the extension in Phase 1 before any data is present.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field-level DB encryption | Custom encrypt/decrypt + store | `prisma-field-encryption` | Key rotation, transparent query interception, handles VARCHAR length expansion |
| JWT sign/verify | Custom HMAC or base64 | `jose` | Web Crypto API, constant-time comparison, JWE support |
| Drag-and-drop sort | Custom mousedown events | `@dnd-kit/sortable` | Accessible keyboard support, touch support, pointer events normalization |
| File drag zone | Custom ondrop handler | `react-dropzone` | MIME type validation, multiple file handling, native OS drag events |
| S3 presigned URLs | Manual HMAC-SHA256 signing | `@aws-sdk/s3-request-presigner` | AWS Signature V4 is non-trivial; expiry clock skew handling |

**Key insight:** The "just encrypt a field" and "just make a drag zone" categories both have significant hidden complexity. Using proven libraries eliminates class-of-bugs that surface only in production.

---

## Common Pitfalls

### Pitfall 1: Skipping Server-Side Auth in Route Handlers

**What goes wrong:** Admin panel redirects to login (middleware works) but `/api/admin/sites` returns data to unauthenticated `curl` requests.

**Why it happens:** Next.js middleware protects page routes but Route Handlers need independent session validation.

**How to avoid:** Create `requireAdmin()` helper that reads the JWT cookie, throws 401 response if invalid. Call as first line of every `/api/admin/*` handler.

**Warning signs:** Admin API callable without browser session cookie.

---

### Pitfall 2: Neon Connection Pooling Breaks Prisma Migrate

**What goes wrong:** `prisma migrate dev` fails with "prepared statement" errors when `DATABASE_URL` points to the pooled connection.

**Why it happens:** Neon's PgBouncer runs in transaction mode, which is incompatible with Prisma's migration advisory lock mechanism.

**How to avoid:** Always set `DIRECT_URL` in `schema.prisma` datasource. Prisma will use it automatically for migrations. [CITED: https://neon.com/docs/guides/prisma]

**Warning signs:** Migration error mentioning prepared statements or advisory locks.

---

### Pitfall 3: R2 Public URL Not Configured / CORS Missing

**What goes wrong:** Photos uploaded to R2 but not visible in `<Image>` — either bucket is private (no public URL) or CORS blocks presigned PUT from browser.

**How to avoid:**
- Enable public bucket access in R2 dashboard OR use presigned GET URLs for display.
- Add CORS rule to R2 bucket allowing `PUT` from your Vercel domain.
- Add R2 domain to `next.config.ts` `images.remotePatterns`.

**Warning signs:** Images 403 or `next/image` optimization rejects the URL.

---

### Pitfall 4: prisma-field-encryption VARCHAR Length

**What goes wrong:** Encrypted phone string is 3-4x longer than raw phone; `@db.VarChar(20)` on customer phone causes migration-time or runtime truncation error.

**How to avoid:** For encrypted fields, use `String @db.Text` or `@db.VarChar(500)`. [CITED: github.com/47ng/prisma-field-encryption]

**Warning signs:** Database insert fails with "value too long for type character varying".

---

### Pitfall 5: dnd-kit with React 19 Strict Mode

**What goes wrong:** Drag handles flicker or trigger double-drop events in React 19 strict mode during development.

**How to avoid:** dnd-kit 6.x+ is React 18/19 compatible. Ensure you are using `@dnd-kit/core@6.3.1` or later. If dev-mode flicker occurs, it is a strict mode double-render artifact — test in production build to confirm.

---

### Pitfall 6: Tailwind v4 shadcn Theme Override

**What goes wrong:** Custom camping color theme (forest green, earth brown) conflicts with shadcn's default zinc-based CSS variables.

**How to avoid:** Define theme overrides in `globals.css` using `@theme` block (Tailwind v4 CSS-first config), not in a separate config file. shadcn's CSS variables (`--primary`, `--accent`, etc.) are set in `:root` and can be overridden there.

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@layer base {
  :root {
    --primary: 138 42% 28%;        /* forest green */
    --primary-foreground: 0 0% 98%;
    --accent: 30 35% 35%;          /* earth brown */
    --accent-foreground: 0 0% 98%;
    /* ... remaining shadcn token overrides */
  }
}
```

---

## Code Examples

### Admin Login Route Handler

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, signAdminToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signAdminToken(username)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  return res
}
```

### requireAdmin Helper (API Route Guard)

```typescript
// src/lib/middleware-auth.ts
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'

export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null // null = proceed
}

// Usage in every admin Route Handler:
// const authError = await requireAdmin()
// if (authError) return authError
```

### Prisma Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { fieldEncryptionExtension } from 'prisma-field-encryption'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const basePrisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

export const prisma = basePrisma.$extends(
  fieldEncryptionExtension({
    encryptionKey: process.env.FIELD_ENCRYPTION_KEY!, // 32-byte hex key
  })
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma
```

### Presigned Upload Route Handler

```typescript
// src/app/api/upload/presigned/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware-auth'
import { generatePresignedUploadUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { filename, contentType, folder } = await req.json()

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const key = `${folder}/${randomUUID()}.${ext}`

  const uploadUrl = await generatePresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, key })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` JS config | CSS-first `@theme` block in `globals.css` | Tailwind v4 (Jan 2025) | No JS config file needed |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` single line | Tailwind v4 | Simpler CSS entry point |
| `tailwindcss-animate` | `tw-animate-css` | shadcn 2025 update | shadcn no longer uses the old plugin |
| Next.js Pages Router | App Router with RSC | Next.js 13+ (stable 14+) | Server Components, Server Actions, layouts |
| NextAuth v4 for all auth | Next-auth v5 beta or jose directly | 2024-2025 | v5 still beta; jose preferred for simple env-based auth |
| Prisma 5 | Prisma 6 | End 2024 | `prisma migrate dev` behavior unchanged; client API largely same |
| `pgbouncer=true` query param | Not needed with Prisma 5.10+ | Prisma 5.10 / Prisma 6 | Cleaner connection string |

**Deprecated/outdated:**
- `tailwindcss-animate`: replaced by `tw-animate-css` in shadcn v4-era
- `@tailwind` directives in CSS: replaced by `@import "tailwindcss"`
- `next-auth` v4 `getServerSession` import from `next-auth/next`: in v5 it changes to `auth()` from your config; stick to jose to avoid this churn

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `react-day-picker` v9.14 and `lucide-react` v1.7 are compatible with React 19 and shadcn Tailwind v4 | Standard Stack | Shadcn may pull different versions; run `npx shadcn@latest init` and check peer dep warnings |
| A2 | `prisma-field-encryption` v1.6 works with Prisma 6 client extensions API | Standard Stack | If incompatible, phone encryption must be done manually in service layer |
| A3 | Next.js 16's Turbopack-by-default does not break `sharp` binaries on deployment | Architecture | Sharp uses native binaries; if Vercel build fails, add `outputFileTracingIncludes` config |
| A4 | Cloudflare R2 free tier (10GB, 1M ops/month) is sufficient for initial campsite photo set | Environment | Monitor R2 dashboard; upgrade plan if exceeded |

---

## Open Questions

1. **Rich Text Editor for Site Description (D-11, Claude's Discretion)**
   - What we know: Site description needs rich text (not plain textarea); decision is left to implementation
   - Options: `@tiptap/react` (lightweight, headless), `react-quill` (heavier, legacy), plain `textarea` with markdown
   - Recommendation: `@tiptap/react` — works with React 19, headless so it integrates with shadcn styling, output is HTML stored as `@db.Text`
   - Blocker: None — can be decided at task execution time

2. **R2 Bucket: Public vs Presigned GET URLs for Display**
   - What we know: Photos need to be visible in admin panel and customer-facing site (Phase 4+)
   - Options: Public bucket (simpler, anyone can enumerate keys) vs presigned GET URLs (private but adds latency)
   - Recommendation: Public bucket with obscure UUIDs as keys — campsite photos are not sensitive; avoids presigned-URL expiry complexity on every page render
   - Blocker: None — can be set in R2 dashboard

3. **`FIELD_ENCRYPTION_KEY` Key Management**
   - What we know: `prisma-field-encryption` needs a 32-byte hex key; if lost, encrypted data is unrecoverable
   - Recommendation: Store in Vercel environment variables (encrypted at rest by Vercel); document in team runbook before go-live
   - Blocker: None for Phase 1 — just needs a key generated and stored before first deploy

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | v22.17.1 | — |
| npm | Package management | Yes | 10.9.2 | — |
| Neon PostgreSQL | Database | Not yet checked | — | Requires account creation + connection string |
| Cloudflare R2 | Photo storage | Not yet checked | — | Requires account + bucket creation |
| Git | Version control | Not checked | — | Required for Vercel deploy |

**Missing dependencies with no fallback:**
- Neon account + project + connection strings: must be created before `prisma migrate dev` can run. Neon free tier is sufficient; account creation is self-serve at neon.tech.
- Cloudflare R2 bucket: must be created in Cloudflare dashboard before any upload can be tested. Requires a Cloudflare account.

**Missing dependencies with fallback:**
- None identified for Phase 1 (no external services beyond Neon + R2 are required)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (via Next.js 16 test config) |
| Config file | `vitest.config.ts` — Wave 0 task |
| Quick run command | `npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run` |

**Note:** Next.js 16 ships with Turbopack; Vitest is preferred over Jest for ESM compatibility in Next.js 16 projects. Jest requires additional transform config for App Router. [ASSUMED — verify at project init; create-next-app may scaffold Jest by default]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Create / edit / delete site type persists to DB | Integration | `npx vitest run tests/api/admin/sites.test.ts -t "CRUD"` | Wave 0 |
| SITE-02 | Presigned upload URL generated for valid image type | Unit | `npx vitest run tests/lib/r2.test.ts` | Wave 0 |
| SITE-02 | Amenities array saved and returned correctly | Integration | `npx vitest run tests/api/admin/sites.test.ts -t "amenities"` | Wave 0 |
| ADDON-01 | Add-on create with all fields saves correctly | Integration | `npx vitest run tests/api/admin/addons.test.ts -t "create"` | Wave 0 |
| ADDON-02 | Toggle isActive flips status in DB | Integration | `npx vitest run tests/api/admin/addons.test.ts -t "toggle"` | Wave 0 |
| ADDON-04 | PriceType enum values accepted and rejected | Unit | `npx vitest run tests/lib/validations/addon.test.ts` | Wave 0 |
| D-03 | Unauthenticated request to /api/admin/* returns 401 | Integration | `npx vitest run tests/api/auth.test.ts -t "unauthorized"` | Wave 0 |
| D-17 | Check-in/out stored as DATE (no time component) | Unit | `npx vitest run tests/lib/prisma-schema.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=dot` (< 15s)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/api/admin/sites.test.ts` — covers SITE-01, SITE-02
- [ ] `tests/api/admin/addons.test.ts` — covers ADDON-01, ADDON-02, ADDON-04
- [ ] `tests/api/auth.test.ts` — covers D-03 (401 enforcement)
- [ ] `tests/lib/r2.test.ts` — covers presigned URL logic
- [ ] `tests/lib/validations/addon.test.ts` — covers PriceType zod schema
- [ ] `vitest.config.ts` — framework config
- [ ] `tests/setup.ts` — Prisma test client + mock setup
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Custom JWT (jose); env-based credentials; httpOnly cookie |
| V3 Session Management | Yes | httpOnly + Secure + SameSite=Lax cookie; 8h expiry; no session fixation surface |
| V4 Access Control | Yes | `requireAdmin()` in every admin Route Handler + middleware |
| V5 Input Validation | Yes | zod schemas on all API inputs |
| V6 Cryptography | Yes | AES encryption for phone field via prisma-field-encryption; JWT HS256 via jose |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT forged cookie | Spoofing | HS256 with 32-byte secret; `jwtVerify` in middleware + route handler |
| Brute-force admin login | Spoofing | Rate-limit `/api/auth/login` (Next.js middleware or Vercel edge config) |
| Unauthenticated API access | Elevation of Privilege | `requireAdmin()` as first line of every admin handler |
| XSS → cookie theft | Spoofing | `httpOnly: true` on session cookie prevents JS access |
| Malicious file upload | Tampering | Server-side MIME type check + file size limit before presigned URL generation; sharp validates on server |
| Korean PIPA — phone PII | Information Disclosure | `prisma-field-encryption` encrypts phone at rest; only decrypt in service layer |
| CSRF on state-changing endpoints | Tampering | `SameSite=Lax` cookie + check `Origin` header on admin POST routes |

**Korean PIPA compliance for Phase 1:**
- Customer phone field encrypted at rest (D-18) — enforced by `prisma-field-encryption`
- Privacy policy page (`/privacy`) required by law — deferred to Phase 10 but schema/data collection decisions made now
- Data minimization: Phase 1 does not collect any customer PII (admin-only phase)

---

## Sources

### Primary (HIGH confidence)

- npm registry (2026-04-06) — verified versions: next@16.2.2, prisma@6.6.0, jose@6.2.2, @aws-sdk/client-s3@3.1024.0, react-dropzone@15.0.0, @dnd-kit/core@6.3.1, zod@4.3.6, sharp@0.34.5, prisma-field-encryption@1.6.0
- [Neon + Prisma connection pooling guide](https://neon.com/docs/guides/prisma) — DIRECT_URL requirement, PgBouncer transaction mode
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — presigned PUT/GET patterns
- [Prisma exclusion constraint issue #17514](https://github.com/prisma/prisma/issues/17514) — confirmed Prisma does not natively scaffold EXCLUDE constraints; requires manual SQL migration
- [prisma-field-encryption GitHub](https://github.com/47ng/prisma-field-encryption) — Prisma 4.7-6.x compatibility confirmed

### Secondary (MEDIUM confidence)

- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — tw-animate-css, CSS-first config, React 19 compatibility
- [Auth.js v5 with Next.js 16 guide](https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg) — confirms v5 is documented through 2026; credentials provider supported
- [WebSearch: Next.js 16 features](https://nextjs.org/blog/next-16) — Turbopack stable default, React 19.2, cacheTag stable
- [WebSearch: Tailwind v4 Next.js 16 setup](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config confirmation

### Tertiary (LOW confidence, flagged)

- A1-A4 in Assumptions Log above

---

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — verified against npm registry 2026-04-06
- Authentication pattern (jose custom JWT): HIGH — jose API is stable and well-documented
- Auth.js v5 status: MEDIUM — still beta on npm; jose approach eliminates this risk
- Neon + Prisma setup: HIGH — verified via Neon official docs
- R2 presigned URL pattern: HIGH — Cloudflare official docs
- Exclusion constraint scaffolding: HIGH — confirmed Prisma limitation + raw SQL workaround
- Field encryption: HIGH — prisma-field-encryption library confirmed compatible

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable libraries; 30 days)
