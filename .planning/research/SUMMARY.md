# Project Research Summary

**Project:** CampingSite — 단일 캠핑장 온라인 예약 시스템
**Domain:** Single-campsite reservation system (Korean market)
**Researched:** 2026-04-06
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

CampingSite is a Korean-market single-campsite reservation system requiring PG payment (Toss Payments / KakaoPay), Kakao AlimTalk notifications, and a 4-tier seasonal pricing engine. The recommended approach is a **Next.js 15 App Router monolith** — a single deployment unit covering the public booking site, admin panel, and API routes. This is intentional and appropriate for this scale: one campsite, one admin operator, tens of peak reservations per day. Microservices would add operational overhead with zero benefit. Module boundaries are enforced inside the monolith (service layer: BookingService, PricingEngine, AvailabilityService, PaymentService, NotificationService) to keep business logic testable without structural overhead.

The most consequential technical decision is the **double-booking prevention strategy**, which must be solved at the database schema level before any booking logic is written. PostgreSQL's range exclusion constraint (`EXCLUDE USING gist`) with a `PENDING_PAYMENT` reservation hold pattern is the correct solution. Related: price snapshots must be stored on the reservation row at creation time — never recalculated from live pricing rules afterward. Both decisions are schema-level choices that are expensive to retrofit. The architecture research and pitfalls research are in full consensus on these two points.

The primary project risk is **external blockers**: Kakao AlimTalk template pre-approval (2–5 business days, cannot be expedited) and PG merchant registration for production credentials (Toss Payments / KakaoPay, 2–4 weeks). These are not code problems. They must be started in the first sprint regardless of where in the build sequence notification and payment features fall. A secondary risk is mobile UX for the date range picker — Korean camping customers are predominantly mobile-first, and desktop-designed calendars frequently break on iOS Safari. Choose a touch-tested date picker from the beginning.

---

## Key Findings

### Recommended Stack

The stack is tightly integrated and each choice justifies the others. Next.js 15 with App Router and TypeScript 5 forms the core; React Server Components reduce JavaScript bundle size for Korean mobile users. Tailwind CSS v4 (CSS-first config, Jan 2025 stable) pairs with shadcn/ui components for admin tables, modals, and date pickers. PostgreSQL 16 via Neon (serverless managed Postgres with connection pooling) with Prisma 5 ORM handles data; Prisma's auto-generated types catch PG webhook shape mismatches at compile time and its nested `include` query pattern maps directly to the reservation + add-ons join structure.

Auth.js v5 handles both Kakao OAuth (Korean users strongly prefer KakaoTalk login) and admin credentials login. Toss Payments SDK v2 (widget-based, no redirect) covers KakaoPay + TossPay + card in a single integration. Solapi Node.js SDK routes Kakao AlimTalk sends through a certified messaging partner — required because Kakao does not offer direct API access to general businesses. Cloudflare R2 stores campsite images with zero egress fees. Vercel hosts the application on a Seoul edge node. Sentry captures payment failure and webhook errors.

**Core technologies:**
- **Next.js 15 (App Router)**: Full-stack framework — SSR for SEO on campsite pages, API Routes for webhooks, Server Actions for forms. Single deployment unit.
- **PostgreSQL 16 + Prisma 5 on Neon**: ACID transactions prevent double-booking; PostgreSQL range exclusion constraint is not available in MySQL. Neon's connection pooler is required for Vercel serverless.
- **Toss Payments SDK v2**: Market-leading Korean PG. KakaoPay + TossPay + card in one SDK. Widget-based checkout (no redirect, better mobile UX).
- **Auth.js v5**: Kakao OAuth built-in. Credentials provider for admin. Single library for both auth flows.
- **Solapi**: Certified Kakao AlimTalk partner. Node.js SDK. Required intermediary — no direct Kakao API for business messaging.
- **Cloudflare R2**: Zero egress fees for image-heavy campsite gallery. S3-compatible API.
- **Vercel**: Zero-config Next.js deployment, Seoul PoP, preview deployments per PR.

**Verify before integrating (items with MEDIUM confidence):**
- Auth.js v5 stable status (was beta at research cutoff) — fall back to NextAuth v4 if still unstable
- Toss Payments npm package name and current SDK major version (`@tosspayments/tosspayments-sdk` — confirm at docs.tosspayments.com)
- Solapi npm package name and current pricing
- Neon + Prisma 5 connection pooler compatibility (`DIRECT_URL` required)

### Expected Features

The Korean camping market has a non-negotiable feature set that users will leave the site for if absent. The 4-tier seasonal pricing model (비수기주중 / 비수기주말 / 성수기주중 / 성수기주말) is a Korean industry standard — it is not optional and must be implemented before any booking flow is built, because all pricing displays and the booking summary depend on it. Kakao AlimTalk notifications are similarly non-negotiable: Korean users treat AlimTalk as the de facto confirmation channel; email-only confirmation signals an amateur product.

**Must have (table stakes):**
- Availability calendar with real-time date blocking per site/room type
- 4-tier seasonal pricing engine — Korean market standard; every competitor uses this
- Per-person surcharge (인원 추가 요금) — near-universal in Korean glamping
- Add-on facility cart during booking (그릴, 장작, 화로대 등)
- KakaoPay + TossPay + card payment via Toss Payments
- Kakao AlimTalk: booking confirmation + D-1 check-in reminder + cancellation notice
- Post-stay review system with booking verification gate
- Admin: reservation management (list, filter, cancel) + room/add-on CRUD + pricing matrix
- Admin dashboard: today's check-in/check-out, revenue summary
- Static info pages: location (Kakao Map embed), facilities, rules, cancellation policy

**Should have (competitive differentiators):**
- Real-time availability heatmap (여유/마감임박/마감 color coding)
- Dynamic cancellation fee calculator — show exact refund before customer confirms
- Blackout date management (admin blocks dates for maintenance or events)
- AlimTalk: D+1 post-checkout review request trigger
- Admin mobile-responsive panel (operator manages on phone)
- Revenue export to CSV/Excel (for 부가세 신고 tax filing)

**Defer to v2+:**
- Waitlist for fully booked dates
- Bulk/group booking (handle via phone until demand is proven)
- Multi-language support (EN/ZH) — validate Korean demand first
- Naver Smart Order / OTA channel sync
- Points/loyalty system

### Architecture Approach

The architecture is a monolith with enforced internal module boundaries. The public site (Next.js pages under `app/`), admin panel (`app/admin/`), and API routes (`app/api/`) all share a service layer implemented as TypeScript modules — not separate processes. This makes business logic independently testable without the operational burden of microservices. The data model is the most critical architectural decision: `Reservation` rows must snapshot `totalPrice` and per-addon `unitPrice` at creation time, and check-in/check-out must be stored as PostgreSQL `DATE` type (not `TIMESTAMP`) since they are local-date concepts, not UTC moments.

**Major components:**
1. **Public Site** (`app/`) — landing, room browsing with availability calendar, multi-step booking flow, confirmation, reviews, info pages
2. **Admin Panel** (`app/admin/`) — dashboard, reservation management, room/add-on CRUD, pricing matrix, customer list, AlimTalk log
3. **API Routes** (`app/api/`) — availability computation, booking creation, payment initiation/webhook, admin endpoints (all protected by `requireAdmin()` middleware)
4. **Service Layer** — BookingService (atomic reservation + hold), PricingEngine (4-tier matrix per night), AvailabilityService (computed from reservations, not pre-populated table), PaymentService (server-to-server PG verification), NotificationService (AlimTalk via Solapi, idempotent sends)
5. **Data Access** — Prisma 5 ORM exclusively; no raw SQL in route handlers

**Key data model decisions (cannot be changed easily later):**
- `Reservation.totalPrice` and `ReservationAddon.unitPrice` are price snapshots — immutable after creation
- `Reservation.checkIn` / `checkOut` are `DATE` type, not `TIMESTAMP`
- `Customer.phone` encrypted at rest (Korean PIPA requirement)
- `Addon` has `daily_stock` / `max_quantity` for inventory tracking
- `CancellationPolicy` modeled as data rows, not hard-coded config

### Critical Pitfalls

All 4 research files converge on the same top risks. These are ordered by consequence severity and phase impact.

1. **Double booking via race condition** — Use PostgreSQL range exclusion constraint + `PENDING_PAYMENT` reservation hold with TTL before any booking logic is written. This is a schema design decision. See PITFALLS.md Pitfall 1.

2. **Payment webhook forgery** — Never trust client-reported payment success. Always make a server-to-server verification call to Toss Payments API before marking a reservation `CONFIRMED`. Verify amount matches stored order total to the won. Store `pgPaymentKey` as idempotency key. See PITFALLS.md Pitfall 2.

3. **Kakao AlimTalk template pre-approval delay** — Submit all 4 templates (booking confirmation, cancellation, D-1 reminder, review request) in Sprint 1, even if the notification feature ships in Phase 4. Approval takes 2–5 business days and templates cannot be changed post-approval without re-approval. Register KakaoTalk Business channel first (additional days). See PITFALLS.md Pitfall 5.

4. **PG merchant registration delay** — Apply for Toss Payments and KakaoPay production merchant accounts immediately. Business verification (사업자등록증) takes 2–4 weeks. Sandbox credentials are available immediately; use them throughout development. Missing this blocks go-live. See PITFALLS.md Pitfall 11.

5. **Pricing snapshot not applied** — If `Reservation` stores only FKs to pricing tables and recalculates on render, admin price changes retroactively alter confirmed booking amounts. This creates customer disputes and breaks settlement reports. Snapshot at creation, always. See PITFALLS.md Pitfall 4.

6. **KST timezone confusion** — Store check-in/check-out as `DATE` type. Store payment events as UTC `TIMESTAMPTZ`. Set DB session timezone to `Asia/Seoul`. Use `date-fns-tz` for all date display. See PITFALLS.md Pitfall 6.

---

## Implications for Roadmap

The architecture research defines a 9-stage build order based on component dependencies. The pitfalls research adds urgency around specific decisions that must happen before their natural feature phase. These two inputs produce the following recommended phase structure.

### Phase 1: Foundation — Schema, Auth, Admin Scaffolding

**Rationale:** All subsequent phases depend on the data model being correct. Pricing snapshot, DATE types, encrypted phone, and add-on inventory are schema decisions that are expensive to change after data exists. Admin auth must be implemented before any admin feature is built (Pitfall 8 — route-level auth gap).

**Delivers:**
- Database schema: all core entities (SiteType, Site, SeasonRule, PricingMatrix, Addon, Reservation, ReservationAddon, Payment, Notification, Review, CancellationPolicy)
- Prisma migrations and client setup
- NextAuth credentials provider for admin login
- Admin route middleware (`requireAdmin()`) applied globally to `/api/admin/*`
- SiteType/Site CRUD (admin) with photo upload to Cloudflare R2
- Add-on CRUD (admin) with inventory fields
- Pricing matrix configuration UI (4-tier × room type)

**Addresses:** Table stakes — room management, add-on management, pricing configuration
**Avoids:** Pitfall 4 (price snapshot), Pitfall 6 (DATE type), Pitfall 7 (add-on inventory), Pitfall 8 (auth gap)

**External actions to start immediately:**
- Submit Kakao AlimTalk templates to Solapi for Kakao pre-approval (Pitfall 5)
- Apply for Toss Payments production merchant account (Pitfall 11)
- Register KakaoTalk Business channel

---

### Phase 2: Availability Engine + Booking Flow

**Rationale:** The pricing engine and availability service are the core of the product. They must be correct and tested before any payment integration begins. The booking flow UI is the customer's primary interaction.

**Delivers:**
- PricingEngine service: iterates nights, applies 4-tier matrix, sums add-ons, returns itemized breakdown
- AvailabilityService: computes available/blocked from existing reservations + DateBlocks (not pre-populated table)
- BookingService: atomic `BEGIN TRANSACTION` → availability check → insert `PENDING_PAYMENT` reservation with TTL hold
- PostgreSQL range exclusion constraint for double-booking prevention
- DateBlock management (admin manual blocking for maintenance, events)
- Public booking flow UI: room selection → date picker (touch-tested for iOS Safari) → add-on cart → booking summary → contact info
- CancellationPolicy data model and refund calculator

**Addresses:** 4-tier pricing, availability calendar, add-on cart, booking summary (all table stakes)
**Avoids:** Pitfall 1 (double booking), Pitfall 4 (pricing snapshot), Pitfall 9 (cancellation policy), Pitfall 10 (mobile calendar)

**Research flag:** Phase-specific research recommended for the PostgreSQL range exclusion constraint implementation and PENDING_PAYMENT hold TTL expiry pattern (pg_cron vs application-level cleanup).

---

### Phase 3: Payment Integration

**Rationale:** Payment cannot be built until the booking flow produces a valid `PENDING_PAYMENT` reservation with a snapshotted price to verify against. This phase implements the full PG webhook flow and all cancellation paths.

**Delivers:**
- Toss Payments SDK v2 widget integration (client-side)
- `/api/payment/initiate` — creates PG order, returns clientKey + orderId to frontend
- `/api/payment/webhook` — server-to-server verification (amount check + signature), updates reservation to `CONFIRMED`
- Virtual account (가상계좌) webhook handler + expiry cron job
- Full and partial cancellation (부분 취소) API with PG cancel call and refund amount tracking
- `payment_cancellations` table for partial cancel tracking
- Post-payment confirmation page

**Addresses:** KakaoPay, TossPay, card payment (table stakes)
**Avoids:** Pitfall 2 (webhook forgery), Pitfall 3 (partial cancel), Pitfall 12 (virtual account expiry)

**External dependency:** Production PG merchant credentials must be approved before go-live testing. Use sandbox throughout development.

**Research flag:** Phase-specific research recommended to verify current Toss Payments SDK v2 package name, webhook signature header name (`TOSS-SIGNATURE`), and KakaoPay partial cancel `cancel_tax_free_amount` requirements before coding.

---

### Phase 4: Notifications (Kakao AlimTalk)

**Rationale:** AlimTalk templates submitted in Phase 1 should be approved by the time this phase begins (2–5 business day lag). Notifications are built on top of confirmed reservations from Phase 3.

**Delivers:**
- NotificationService with idempotent send logic (notification_log table with unique constraint on reservation_id + template_id)
- Booking confirmation AlimTalk (triggered on `CONFIRMED` status)
- Cancellation AlimTalk (triggered on `CANCELLED` status)
- SMS fallback path (via Solapi) for users without KakaoTalk
- Vercel Cron Job for D-1 check-in reminder
- Vercel Cron Job for D+1 review request trigger
- AlimTalk send log in admin panel

**Addresses:** Kakao AlimTalk notifications (table stakes)
**Avoids:** Pitfall 5 (template approval — mitigated by early submission), Pitfall 15 (duplicate sends)

---

### Phase 5: Admin Operations

**Rationale:** The operator needs reservation management, customer view, and the dashboard to run daily operations. This phase is built on the confirmed reservation data from Phases 2–4.

**Delivers:**
- Reservation list: filter by date, status, room type; manual cancellation trigger
- Customer list with reservation history
- Admin dashboard: today's check-in/check-out, revenue today/month, occupancy rate
- Revenue export to CSV
- Blackout date management (site-wide or per-room)

**Addresses:** Admin reservation management, dashboard, customer list (table stakes); revenue CSV export (differentiator)
**Avoids:** Pitfall 16 (KST date filter — use explicit `AT TIME ZONE 'Asia/Seoul'` in dashboard queries)

---

### Phase 6: Reviews + Social Proof

**Rationale:** Reviews require completed reservations to exist. The review system is a trust accelerator for future bookings but does not block the core booking flow. Build after the reservation lifecycle is complete.

**Delivers:**
- ReviewService: submission gated on `status = COMPLETED` + `check_out_date < TODAY()`
- Unique constraint: one review per reservation_id
- Photo attachment on review (upload to R2)
- Admin moderation + reply UI
- Public review listing page with aggregate star rating on room cards

**Addresses:** Post-stay review system (table stakes)
**Avoids:** Pitfall 13 (fake reviews)

---

### Phase 7: Public Site Polish + Info Pages

**Rationale:** Static and semi-static content. No complex dependencies. Can be parallelized with other phases in execution but placed last here to prevent scope creep during core feature development.

**Delivers:**
- Landing page (hero, campsite highlights, room previews)
- Room detail pages with photo carousel and pricing table
- Location page with Kakao Map embed
- Facilities and nearby attractions pages
- Operating rules and check-in time (이용규정)
- Privacy policy page (개인정보처리방침) — legally required under Korean PIPA
- Cancellation policy display (required by Korean Consumer Protection Act before payment)

**Addresses:** Site info pages, location map, operating rules (table stakes)

---

### Phase Ordering Rationale

- **Schema first (Phase 1):** Price snapshots, DATE types, and add-on inventory cannot be retrofitted cheaply. Getting these right before writing service logic is the single highest-leverage decision.
- **Pricing before payment (Phase 2 before Phase 3):** Payment verification requires comparing webhook amount against a stored expected amount. That stored amount comes from the PricingEngine. The dependency chain is non-negotiable.
- **Booking hold before payment (Phase 2 before Phase 3):** The race condition protection must exist before real money flows. This is the ARCHITECTURE.md critical path.
- **Notifications after payment (Phase 4 after Phase 3):** AlimTalk confirmation is triggered by `CONFIRMED` status, which only exists after webhook verification.
- **External blockers are parallel tracks:** AlimTalk template approval and PG merchant registration run in parallel with Phases 1–2 and should be started immediately.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2 (Booking Flow):** PostgreSQL range exclusion constraint syntax for date range overlap; PENDING_PAYMENT hold expiry implementation (pg_cron vs Vercel Cron cleanup job). Patterns exist but implementation details have sharp edges.
- **Phase 3 (Payment):** Toss Payments SDK v2 current package name, current webhook signature header, and KakaoPay partial cancel `cancel_tax_free_amount` semantics change frequently. Must verify against live docs at implementation time.
- **Phase 4 (Notifications):** Solapi SDK current API version, AlimTalk template variable naming conventions, and SMS fallback configuration need live doc verification.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** Next.js 15 App Router, Prisma 5, Neon setup, NextAuth credentials — well-documented, established patterns with no Korean-specific nuances.
- **Phase 5 (Admin Operations):** Standard CRUD + aggregation queries. No novel patterns.
- **Phase 6 (Reviews):** Standard gated content pattern. No novel patterns.
- **Phase 7 (Public Site):** Static content + Kakao Map embed. Kakao Maps JS API is straightforward.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Next.js 15, PostgreSQL, Prisma, Tailwind v4, Cloudflare R2, Vercel all HIGH. Auth.js v5 MEDIUM (verify stable). Toss Payments SDK v2 MEDIUM-HIGH (verify package name). Solapi MEDIUM (verify current SDK). |
| Features | HIGH | 4-tier pricing, AlimTalk, add-on cart, review gating all corroborated by PROJECT.md and Korean market training data. Competitor feature set based on pre-Aug 2025 training — could not verify via WebFetch. |
| Architecture | HIGH | Monolith pattern, service layer boundaries, compute-on-read availability, price snapshot, DATE type — all established patterns with strong consensus across architecture and pitfalls research. |
| Pitfalls | MEDIUM-HIGH | Double booking, webhook forgery, price snapshot, KST timezone — HIGH confidence (established technical problems). PG merchant timelines, AlimTalk approval timelines — MEDIUM (Korea-specific operational knowledge, training data). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Auth.js v5 stability:** Verify at https://authjs.dev before Phase 1 begins. If still beta/unstable, use NextAuth v4 with Prisma adapter — the migration path is well-documented.
- **Toss Payments SDK v2 package name:** Confirm exact npm package at https://docs.tosspayments.com before Phase 3. The package name may have changed since training cutoff.
- **가상계좌 business decision:** Decide before Phase 3 whether to support virtual account payment. It adds async webhook complexity but excluding it means losing older Korean demographics who prefer bank transfer. This is a product decision, not technical.
- **Partial cancel scope:** Decide before Phase 3 whether removing an add-on after booking triggers a partial PG cancel or a credit on next booking. Each path has materially different implementation complexity.
- **Kakao Map vs Naver Map:** PITFALLS.md notes Korean users expect Naver Map embeds on location pages, but FEATURES.md recommends Kakao Map API. Resolve this preference with the campsite operator before Phase 7 (Korean camping audience trend favors Naver Maps for directions).
- **No-customer-account flow:** ARCHITECTURE.md recommends no customer accounts for v1 (booking confirmed via reservation ID + phone number). This simplifies auth significantly but means no booking history view for customers. Confirm this is acceptable per project requirements before Phase 1 schema finalization.

---

## Sources

### Primary (HIGH confidence)
- `D:/개발/camping/.planning/PROJECT.md` — project requirements and constraints
- Next.js 15 Official Blog (https://nextjs.org/blog/next-15, Oct 2024) — confirmed stable release, React 19 GA
- PostgreSQL documentation — range exclusion constraints, row-level locking patterns

### Secondary (MEDIUM confidence)
- Training knowledge (cutoff Aug 2025): Toss Payments SDK v2, Auth.js v5, Neon managed Postgres, Solapi AlimTalk SDK
- Training knowledge: Korean camping market (Glampick, AutoCamping, Naver Camping category) — 4-tier pricing, AlimTalk expectations, KakaoPay conversion patterns
- Training knowledge: Korean PIPA (개인정보보호법) compliance requirements, Consumer Protection Act refund disclosure rules

### Tertiary (LOW-MEDIUM confidence — verify at implementation)
- https://docs.tosspayments.com — SDK v2 current package name, webhook signature spec
- https://docs.solapi.com — current npm package name, AlimTalk template variable conventions
- https://authjs.dev — Auth.js v5 current stability status
- https://neon.tech/docs — Prisma 5 + Neon connection pooler compatibility

---

*Research completed: 2026-04-06*
*Ready for roadmap: yes*
