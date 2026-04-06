<!-- GSD:project-start source:PROJECT.md -->
## Project

**CampingSite**

단일 캠핑장을 위한 공식 홈페이지 겸 온라인 예약 시스템. 고객이 객실을 선택하고, 부대시설(그릴, 장작 등)을 장바구니처럼 추가한 뒤 실결제까지 완료할 수 있다. 캠핑장 운영자는 풀 관리자 패널에서 예약, 객실, 부대시설, 고객, 매출을 통합 관리한다.

**Core Value:** 고객이 원하는 날짜에 객실을 선택하고, 필요한 부대시설을 추가하여, 결제까지 한 번에 완료할 수 있어야 한다.

### Constraints

- **Design Tool**: Google Stitch MCP -- UI/UX 디자인 생성에 활용
- **Market**: 한국 캠핑장 -- 한국어, 한국 결제(토스페이/카카오페이), 카카오 알림톡
- **Tech Stack**: 리서치 기반으로 최적 스택 결정 (Next.js 유력)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack React framework | SSR for SEO (캠핑장 소개 페이지), API Routes for payment callbacks and AlimTalk triggers, Server Actions for form submissions. Single deployment unit eliminates a separate backend service. React 19 stable. **Confirmed production-stable.** |
| React | 19.x | UI library | Ships with Next.js 15 App Router. Server Components reduce JS bundle for mobile users (한국 모바일 비중 높음). |
| TypeScript | 5.x | Type safety | `next.config.ts` now natively supported in Next.js 15. Catches Korean PG webhook shape mismatches at compile time. |
### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | Google Stitch MCP generates Tailwind-compatible output. v4 uses CSS-first configuration (no `tailwind.config.js` needed). Removes friction between design output and code. |
| shadcn/ui | latest (2025) | Component primitives | Headless, copy-paste components. Works with Radix UI underneath. Admin panel tables, modals, date pickers all available. Not a dependency — no version lock-in risk. |
### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Primary relational database | Reservation systems require ACID transactions (double-booking prevention). Complex availability queries (날짜 범위, 객실 유형) benefit from proper SQL. Korean hosting providers (Railway, Supabase, Neon) all offer managed Postgres. |
| Prisma ORM | 5.x | Database access layer | Best-in-class TypeScript DX. Auto-generated types match DB schema exactly. Migration tooling (`prisma migrate dev`) is critical for a team building iteratively. Well-documented, large ecosystem. |
| Neon | latest | Managed Postgres host | Serverless Postgres with connection pooling built-in — essential for Vercel/serverless deployments where connection limits are a real concern. Free tier sufficient for initial launch. |
### Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NextAuth.js (Auth.js) | v5 (beta → stable in 2025) | Customer login + Admin auth | Supports Kakao OAuth (필수 — 한국 사용자는 카카오 로그인 선호). Also supports credentials (email/password) for admin panel. Server-side session handling via database adapter. Single library handles both customer and admin auth flows. |
### Korean Payment Gateway (PG)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Toss Payments | SDK v2 (`@tosspayments/tosspayments-sdk`) | Primary payment processor | Market leader in Korean PG. Supports TossPay + KakaoPay + card in one SDK. v2 Widget UI is embeddable — no redirect flow, better UX. Webhook-based confirmation. Developer docs are excellent (English + Korean). Monthly settlement reports built-in for 매출 관리. |
### Kakao AlimTalk (카카오 알림톡)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Solapi Node.js SDK | `solapi` ^4.x | AlimTalk notification service | Kakao does not offer a direct REST API for AlimTalk to general businesses. Businesses must use a registered KakaoTalk Business channel + a certified messaging service provider (공식 발송 대행사). Solapi (구 PPURIO/coolsms) is the most developer-friendly certified provider with a Node.js SDK, clear pricing, and good documentation. |
- 예약 확정 알림
- 입실 D-1 리마인더
- 예약 취소 확인
### File Storage
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cloudflare R2 | N/A (S3-compatible) | Campsite photos, room images | S3-compatible API (no SDK change if switching). Zero egress fees — critical because campsite photo galleries generate many image requests. Free tier: 10GB storage, 1M operations/month. Sufficient for initial launch. |
| next/image | built-in Next.js 15 | Image optimization | Automatic WebP conversion and resizing. Pair with Cloudflare R2 domain as `remotePatterns` source. |
### Email
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend | latest | Transactional email | For non-Kakao users (email confirmation, admin alerts). React Email for template authoring — JSX-based templates colocate with the Next.js codebase. Generous free tier (3,000 emails/month). |
### Infrastructure & Hosting
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | latest | Frontend + API hosting | Zero-config Next.js deployment. Edge Network has Korean PoP (Seoul). Automatic preview deployments per PR. Free hobby tier for initial launch; Pro tier (~$20/mo) when ready for custom domain + more bandwidth. |
| Neon | latest | Managed PostgreSQL | Serverless connection pooling (critical with Vercel's serverless functions). Branching feature mirrors Vercel preview deployments — separate DB state per PR. |
| Cloudflare | Free plan | DNS + CDN | DNS management and DDoS protection in front of Vercel. Korean campsite sites occasionally get targeted by spam reservations. |
### Monitoring & Observability
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Sentry | latest | Error tracking | Next.js 15 `onRequestError` instrumentation hook integrates directly with Sentry. Payment failure errors and webhook failures must be captured. |
## Design Toolchain
| Technology | Purpose | Notes |
|------------|---------|-------|
| Google Stitch MCP | AI-based UI/UX mockup generation | Generates Tailwind CSS + component specs. Output feeds directly into shadcn/ui component implementation. Constraint: output is a starting point, not final production code. |
| Tailwind CSS v4 | Style system | Matches Stitch output format. v4 uses CSS variables natively — aligns with shadcn/ui's token system. |
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
## Installation
# Create project
# Core dependencies
# UI components (shadcn/ui — copy-paste, not npm install)
# Dev dependencies
# Initialize Prisma
# Sentry (run after project is created)
# Install Toss Payments SDK (verify exact package name at docs.tosspayments.com)
## Key Environment Variables
# Database
# Auth
# Toss Payments
# Kakao AlimTalk (via Solapi)
# Storage
# Email
# Sentry
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
## Sources
- Next.js 15 Official Blog: `https://nextjs.org/blog/next-15` (fetched 2026-04-06, published Oct 2024)
- Toss Payments Developer Docs: `https://docs.tosspayments.com` (not fetched — verify directly)
- Kakao AlimTalk Business: `https://business.kakao.com` (not fetched — verify directly)
- Solapi Docs: `https://docs.solapi.com` (not fetched — verify directly)
- Neon Docs: `https://neon.tech/docs` (not fetched — verify directly)
- Auth.js v5 Docs: `https://authjs.dev` (not fetched — verify current stable status)
- Prisma Docs: `https://www.prisma.io/docs` (not fetched — verify current version)
- Training knowledge (cutoff Aug 2025) for remaining technology assessments
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
