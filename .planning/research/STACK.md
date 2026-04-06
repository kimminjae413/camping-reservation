# Technology Stack

**Project:** CampingSite — 단일 캠핑장 온라인 예약 시스템
**Researched:** 2026-04-06
**Research basis:** Training knowledge (cutoff Aug 2025) + Next.js 15 official blog (verified via WebFetch)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack React framework | SSR for SEO (캠핑장 소개 페이지), API Routes for payment callbacks and AlimTalk triggers, Server Actions for form submissions. Single deployment unit eliminates a separate backend service. React 19 stable. **Confirmed production-stable.** |
| React | 19.x | UI library | Ships with Next.js 15 App Router. Server Components reduce JS bundle for mobile users (한국 모바일 비중 높음). |
| TypeScript | 5.x | Type safety | `next.config.ts` now natively supported in Next.js 15. Catches Korean PG webhook shape mismatches at compile time. |

**Confidence: HIGH** — Next.js 15 stable release confirmed from official blog (Oct 2024). React 19 GA confirmed.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | Google Stitch MCP generates Tailwind-compatible output. v4 uses CSS-first configuration (no `tailwind.config.js` needed). Removes friction between design output and code. |
| shadcn/ui | latest (2025) | Component primitives | Headless, copy-paste components. Works with Radix UI underneath. Admin panel tables, modals, date pickers all available. Not a dependency — no version lock-in risk. |

**Confidence: HIGH (Tailwind 4 stable Jan 2025)** | **MEDIUM (shadcn/ui — well-established but verify current component list)**

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Primary relational database | Reservation systems require ACID transactions (double-booking prevention). Complex availability queries (날짜 범위, 객실 유형) benefit from proper SQL. Korean hosting providers (Railway, Supabase, Neon) all offer managed Postgres. |
| Prisma ORM | 5.x | Database access layer | Best-in-class TypeScript DX. Auto-generated types match DB schema exactly. Migration tooling (`prisma migrate dev`) is critical for a team building iteratively. Well-documented, large ecosystem. |
| Neon | latest | Managed Postgres host | Serverless Postgres with connection pooling built-in — essential for Vercel/serverless deployments where connection limits are a real concern. Free tier sufficient for initial launch. |

**Confidence: HIGH (PostgreSQL + Prisma 5)** | **MEDIUM (Neon — strong choice but Railway/Supabase are valid alternatives)**

**Why NOT Drizzle ORM:** Drizzle requires writing raw SQL-like syntax. Prisma's `findMany` with nested `include` maps directly to the reservation + add-ons query pattern this project needs. Drizzle is faster but the DX advantage of Prisma outweighs raw performance for a single-campsite site with low traffic.

**Why NOT MySQL:** PostgreSQL's `EXCLUDE` constraint for overlapping date ranges is a native feature that prevents double-bookings at the database level. MySQL has no equivalent.

**Why NOT SQLite:** No row-level locking suitable for concurrent reservation writes. Fine for development, not for production.

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NextAuth.js (Auth.js) | v5 (beta → stable in 2025) | Customer login + Admin auth | Supports Kakao OAuth (필수 — 한국 사용자는 카카오 로그인 선호). Also supports credentials (email/password) for admin panel. Server-side session handling via database adapter. Single library handles both customer and admin auth flows. |

**Confidence: MEDIUM** — Auth.js v5 was in beta at training cutoff. Verify it reached stable before adopting. The Kakao OAuth provider is built-in. If v5 is still unstable, use NextAuth v4 + Prisma adapter instead.

**Why NOT Clerk:** No native Kakao OAuth support without custom provider setup. Overkill for a single-campsite site. Adds cost.

**Why NOT Supabase Auth:** Works but splits auth from the rest of the app. Adds a second service dependency.

### Korean Payment Gateway (PG)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Toss Payments | SDK v2 (`@tosspayments/tosspayments-sdk`) | Primary payment processor | Market leader in Korean PG. Supports TossPay + KakaoPay + card in one SDK. v2 Widget UI is embeddable — no redirect flow, better UX. Webhook-based confirmation. Developer docs are excellent (English + Korean). Monthly settlement reports built-in for 매출 관리. |

**Confidence: MEDIUM-HIGH** — Toss Payments is the dominant Korean PG choice (2024-2025). SDK v2 existed at training cutoff. Verify current npm package name and whether v2 is the current major version before integrating.

**Integration pattern:**
```
Client: @tosspayments/tosspayments-sdk (Widget)
  → User confirms payment in widget
  → Client calls /api/payments/confirm (Next.js Route Handler)
  → Server calls Toss Payments REST API to confirm
  → Server creates reservation record in DB
  → Server triggers Kakao AlimTalk
```

**Why NOT KakaoPay direct:** KakaoPay as a standalone PG requires separate merchant agreement. Toss Payments SDK includes KakaoPay as a payment method — no extra agreement needed.

**Why NOT INICIS / KG이니시스:** Older ActiveX-era PG. Developer experience is poor. Mobile UX inferior.

**Why NOT PortOne (구 아임포트):** Valid alternative — PortOne v2 unifies multiple PGs including Toss and KakaoPay. Use PortOne if you need multi-PG failover or if Toss Payments approval is slow. For a greenfield project, direct Toss Payments integration is simpler.

### Kakao AlimTalk (카카오 알림톡)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Solapi Node.js SDK | `solapi` ^4.x | AlimTalk notification service | Kakao does not offer a direct REST API for AlimTalk to general businesses. Businesses must use a registered KakaoTalk Business channel + a certified messaging service provider (공식 발송 대행사). Solapi (구 PPURIO/coolsms) is the most developer-friendly certified provider with a Node.js SDK, clear pricing, and good documentation. |

**Confidence: MEDIUM** — Solapi is a well-known certified AlimTalk provider. The constraint that Kakao requires going through an official messaging partner (알림톡 발송 대행사) is firm Korean market reality. Verify Solapi npm package name (`solapi`) and current API version before integrating.

**Prerequisites (non-code, must complete before development):**
1. 카카오 비즈니스 채널 개설 (KakaoTalk Business channel)
2. 알림톡 템플릿 승인 (template must be pre-approved by Kakao — allow 3-5 business days)
3. Solapi 계정 개설 및 발신 프로파일 등록

**Templates needed:**
- 예약 확정 알림
- 입실 D-1 리마인더
- 예약 취소 확인

**Why NOT direct Kakao API:** No such thing for AlimTalk — Kakao requires certified messaging partners for business notifications.

**Why NOT NHN Cloud (구 Toast Cloud):** Valid alternative. NHN Cloud also offers AlimTalk. Solapi has better English documentation and simpler onboarding for small businesses.

### File Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cloudflare R2 | N/A (S3-compatible) | Campsite photos, room images | S3-compatible API (no SDK change if switching). Zero egress fees — critical because campsite photo galleries generate many image requests. Free tier: 10GB storage, 1M operations/month. Sufficient for initial launch. |
| next/image | built-in Next.js 15 | Image optimization | Automatic WebP conversion and resizing. Pair with Cloudflare R2 domain as `remotePatterns` source. |

**Confidence: HIGH** — Cloudflare R2 pricing and S3 compatibility are well-established.

**Why NOT AWS S3:** Egress costs add up for image-heavy site. R2 is the obvious choice for a cost-conscious single-site project.

**Why NOT Vercel Blob:** Per-GB pricing less favorable than R2 for media-heavy content.

### Email

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend | latest | Transactional email | For non-Kakao users (email confirmation, admin alerts). React Email for template authoring — JSX-based templates colocate with the Next.js codebase. Generous free tier (3,000 emails/month). |

**Confidence: MEDIUM** — Resend + React Email was the emerging standard at training cutoff. Verify pricing hasn't changed.

### Infrastructure & Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | latest | Frontend + API hosting | Zero-config Next.js deployment. Edge Network has Korean PoP (Seoul). Automatic preview deployments per PR. Free hobby tier for initial launch; Pro tier (~$20/mo) when ready for custom domain + more bandwidth. |
| Neon | latest | Managed PostgreSQL | Serverless connection pooling (critical with Vercel's serverless functions). Branching feature mirrors Vercel preview deployments — separate DB state per PR. |
| Cloudflare | Free plan | DNS + CDN | DNS management and DDoS protection in front of Vercel. Korean campsite sites occasionally get targeted by spam reservations. |

**Confidence: HIGH (Vercel + Cloudflare)** | **MEDIUM (Neon — verify connection pooler compatibility with Prisma 5)**

**Korean market consideration:** Vercel has a Seoul edge network node (ap-northeast-2 region mapped). Latency from Korean users is acceptable. No need for domestic Korean hosting (AWS Seoul / NCP) unless latency becomes a measured issue.

### Monitoring & Observability

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Sentry | latest | Error tracking | Next.js 15 `onRequestError` instrumentation hook integrates directly with Sentry. Payment failure errors and webhook failures must be captured. |

**Confidence: HIGH** — Sentry + Next.js 15 integration is explicitly documented in the Next.js 15 blog.

---

## Design Toolchain

| Technology | Purpose | Notes |
|------------|---------|-------|
| Google Stitch MCP | AI-based UI/UX mockup generation | Generates Tailwind CSS + component specs. Output feeds directly into shadcn/ui component implementation. Constraint: output is a starting point, not final production code. |
| Tailwind CSS v4 | Style system | Matches Stitch output format. v4 uses CSS variables natively — aligns with shadcn/ui's token system. |

**Confidence: MEDIUM** — Google Stitch MCP is noted in project constraints but is relatively new tooling. Treat its output as design-to-code assistance, not deployable code. Verify the Stitch MCP server is accessible in your development environment before building the design phase.

---

## Alternatives Considered

| Category | Recommended | Alternatives Rejected | Why Rejected |
|----------|-------------|----------------------|--------------|
| Framework | Next.js 15 | Remix, Nuxt (Vue), SvelteKit | Next.js has largest Korean developer ecosystem; Google Stitch outputs React; Kakao/Toss SDK examples are React-first |
| ORM | Prisma 5 | Drizzle, TypeORM | Drizzle: better perf but worse DX for nested relational queries; TypeORM: legacy, poor TS support |
| Database | PostgreSQL | MySQL, PlanetScale | PlanetScale shut down free tier; MySQL lacks date exclusion constraints; PostgreSQL is standard |
| Auth | Auth.js v5 | Clerk, Supabase Auth, custom JWT | Clerk: no Kakao OAuth; Supabase Auth: extra service; custom JWT: unnecessary complexity |
| Korean PG | Toss Payments | PortOne v2, INICIS, NicePayments | PortOne valid but extra abstraction layer; INICIS: old UX; NicePay: limited docs |
| AlimTalk | Solapi | NHN Cloud, Bizmsg | NHN Cloud: more complex setup for small biz; Bizmsg: inferior SDK |
| Storage | Cloudflare R2 | AWS S3, Vercel Blob | S3: egress costs; Vercel Blob: less cost-effective for media |
| Hosting | Vercel | AWS, NCP, Railway | AWS: operational overhead; NCP: no Next.js-native deploy; Railway: no edge CDN |
| CSS | Tailwind v4 | CSS Modules, Emotion, Styled Components | Stitch outputs Tailwind; CSS Modules: more verbose; CSS-in-JS: runtime overhead |
| UI Components | shadcn/ui | Chakra UI, Ant Design, MUI | Ant Design: Chinese market focus, heavy bundle; Chakra/MUI: runtime CSS-in-JS; shadcn: zero lock-in |

---

## Installation

```bash
# Create project
npx create-next-app@latest camping-site \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Core dependencies
npm install \
  prisma @prisma/client \
  next-auth \
  @auth/prisma-adapter \
  solapi \
  resend \
  react-email \
  @aws-sdk/client-s3 \
  @aws-sdk/s3-request-presigner \
  zod \
  date-fns \
  @tanstack/react-query

# UI components (shadcn/ui — copy-paste, not npm install)
npx shadcn@latest init
npx shadcn@latest add button card dialog table form calendar badge

# Dev dependencies
npm install -D \
  @types/node \
  prisma

# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Sentry (run after project is created)
npx @sentry/wizard@latest -i nextjs
```

**Toss Payments SDK:**
```bash
# Install Toss Payments SDK (verify exact package name at docs.tosspayments.com)
npm install @tosspayments/tosspayments-sdk
```

**Note:** The Toss Payments npm package name should be verified at `https://docs.tosspayments.com` before installation. The SDK v2 widget-based integration is the recommended pattern as of 2024-2025.

---

## Key Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # Neon requires both for connection pooling

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.com"
KAKAO_CLIENT_ID="..."
KAKAO_CLIENT_SECRET="..."

# Toss Payments
TOSS_CLIENT_KEY="test_ck_..."      # Public - used on client
TOSS_SECRET_KEY="test_sk_..."      # Secret - server only

# Kakao AlimTalk (via Solapi)
SOLAPI_API_KEY="..."
SOLAPI_API_SECRET="..."
SOLAPI_SENDER_PHONE="..."
SOLAPI_KAKAO_CHANNEL_ID="..."

# Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="camping-media"
R2_PUBLIC_URL="https://..."

# Email
RESEND_API_KEY="re_..."

# Sentry
SENTRY_DSN="..."
```

---

## Confidence Assessment

| Area | Confidence | Basis | Validation Needed |
|------|------------|-------|-------------------|
| Next.js 15 + React 19 | HIGH | Official blog confirmed Oct 2024, stable | None |
| TypeScript 5 | HIGH | Training knowledge, widely adopted | None |
| Tailwind CSS v4 | HIGH | Released Jan 2025, training knowledge | None |
| shadcn/ui | HIGH | Well-established, widely used | Check current component list |
| PostgreSQL + Prisma 5 | HIGH | Stable, production-proven | None |
| Neon (managed Postgres) | MEDIUM | Strong choice at training cutoff | Verify Prisma 5 pooler compatibility |
| Auth.js v5 | MEDIUM | Was in beta at training cutoff | Verify stable release; fall back to v4 if needed |
| Toss Payments SDK v2 | MEDIUM-HIGH | Market leader, SDK v2 existed | Verify npm package name and current major version |
| Solapi for AlimTalk | MEDIUM | Known certified provider | Verify npm package name (`solapi`), current pricing |
| Cloudflare R2 | HIGH | Stable pricing and API | None |
| Vercel | HIGH | Standard Next.js hosting | None |
| Resend | MEDIUM | Emerging standard at cutoff | Verify pricing tier |
| Google Stitch MCP | LOW-MEDIUM | Project constraint, relatively new | Verify MCP server accessibility in dev environment |

---

## Sources

- Next.js 15 Official Blog: `https://nextjs.org/blog/next-15` (fetched 2026-04-06, published Oct 2024)
- Toss Payments Developer Docs: `https://docs.tosspayments.com` (not fetched — verify directly)
- Kakao AlimTalk Business: `https://business.kakao.com` (not fetched — verify directly)
- Solapi Docs: `https://docs.solapi.com` (not fetched — verify directly)
- Neon Docs: `https://neon.tech/docs` (not fetched — verify directly)
- Auth.js v5 Docs: `https://authjs.dev` (not fetched — verify current stable status)
- Prisma Docs: `https://www.prisma.io/docs` (not fetched — verify current version)
- Training knowledge (cutoff Aug 2025) for remaining technology assessments
