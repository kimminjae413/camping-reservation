# Architecture Patterns

**Domain:** Single-campsite reservation and booking system (Korean market)
**Researched:** 2026-04-06
**Confidence:** HIGH (established patterns for this system class; Korean-specific integrations MEDIUM)

---

## Recommended Architecture

**Pattern: Monolithic Next.js application with clear internal module boundaries.**

This is a single-campsite site with one admin. A microservices split would introduce operational complexity with zero benefit at this scale. Instead, enforce strict module separation *within* a monolith — making a future split possible without requiring it now.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Public Site │  │  Admin Panel │  │   API Routes     │  │
│  │  (app/...)   │  │  (app/admin) │  │  (app/api/...)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
│  ┌──────▼─────────────────▼────────────────────▼──────────┐ │
│  │                   Service Layer                         │ │
│  │  BookingService | PricingEngine | AvailabilityService   │ │
│  │  NotificationService | PaymentService | ReviewService   │ │
│  └───────────────────────────┬─────────────────────────────┘ │
│                              │                               │
│  ┌───────────────────────────▼─────────────────────────────┐ │
│  │              Data Access Layer (Prisma ORM)              │ │
│  └───────────────────────────┬─────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────┘
                               │
              ┌────────────────▼─────────────────┐
              │         PostgreSQL Database        │
              └──────────────────────────────────┘

External Services:
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Toss/Kakao  │  │  Kakao       │  │  Object      │
  │  Payments PG │  │  AlimTalk    │  │  Storage     │
  │  (결제)      │  │  (알림톡)    │  │  (이미지)    │
  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Component Boundaries

### 1. Public Site (Customer-facing)

**Responsibility:** Display campsite information, enable browsing availability, complete bookings with payment.

**Pages:**
- `/` — Landing/introduction page (campsite intro, hero, highlights)
- `/sites` — Site/room type listing with availability calendar
- `/sites/[id]` — Individual site detail with photo gallery, amenities, pricing table
- `/booking` — Booking flow: date selection → add-ons → summary → payment
- `/booking/confirm` — Post-payment confirmation page
- `/reviews` — Public review listing
- `/info` — Location, facilities, nearby attractions

**Communicates with:** API Routes (read availability, submit booking, fetch reviews)

**Does NOT directly touch:** Database, payment SDK internals, notification logic

---

### 2. Admin Panel

**Responsibility:** Full operational management. Protected by authentication middleware.

**Pages:**
- `/admin/dashboard` — Revenue, occupancy, today's check-in/check-out
- `/admin/reservations` — List, filter, view, cancel reservations
- `/admin/sites` — CRUD for campsite units (type, price, photos, capacity)
- `/admin/addons` — CRUD for add-on facilities (grill, firewood, etc.)
- `/admin/pricing` — Seasonal pricing configuration (4-tier matrix)
- `/admin/customers` — Customer list and reservation history
- `/admin/reviews` — Review moderation, reply management
- `/admin/notifications` — AlimTalk send history, manual send triggers

**Communicates with:** API Routes (all admin endpoints, protected)

**Authorization:** Single admin role. Middleware guards all `/admin` paths. No multi-tenant complexity.

---

### 3. API Routes (app/api/)

**Responsibility:** All server-side logic exposed as HTTP endpoints. Next.js Route Handlers.

**Endpoint Groups:**

```
/api/sites/                         → Site listings and detail
/api/sites/[id]/availability        → Calendar availability for a site
/api/booking/                       → Create booking, booking status
/api/booking/[id]/cancel            → Cancellation
/api/pricing/calculate              → Price calculation for a date range + add-ons
/api/payment/initiate               → Create payment order with PG
/api/payment/webhook                → PG callback (Toss/Kakao webhook)
/api/addons/                        → List available add-ons
/api/reviews/                       → Submit review, list reviews
/api/admin/reservations/            → Admin: reservation management
/api/admin/sites/                   → Admin: site CRUD
/api/admin/addons/                  → Admin: add-on CRUD
/api/admin/pricing/                 → Admin: pricing CRUD
/api/admin/customers/               → Admin: customer data
/api/admin/dashboard/               → Admin: dashboard stats
/api/admin/notifications/send       → Admin: manual AlimTalk send
```

**Authentication:** All `/api/admin/*` routes validated via session token (NextAuth or similar). Public routes are read-only or POST-only (booking creation, review submission).

---

### 4. Service Layer (Internal Modules)

These are not separate processes — they are TypeScript modules imported by API routes. Enforcing this boundary keeps business logic testable and isolated.

#### BookingService
**Responsibilities:**
- Create reservations (validate availability → lock → record payment intent)
- Cancel reservations (trigger refund → release availability → send notification)
- Fetch booking by ID, list bookings with filters

**Critical logic:** Atomic availability check-and-lock. Must prevent double-booking. Use database transactions with row-level locking or a `status: 'PENDING_PAYMENT'` reservation that expires.

#### AvailabilityService
**Responsibilities:**
- Given a site ID + date range, return available/unavailable per night
- Generate calendar data for the availability picker UI
- Invalidate availability when bookings are created/cancelled

**Data approach:** Do not store availability as a separate table with pre-populated rows (maintenance nightmare). Instead, compute availability from existing reservations:

```
available(siteId, date) = true
  IF no confirmed booking covers that date for that site
  AND date is not manually blocked by admin
```

#### PricingEngine
**Responsibilities:**
- Given site ID + check-in date + check-out date + add-ons, calculate total price
- Apply the 4-tier seasonal pricing matrix
- Return itemized breakdown (base price per night, add-on costs, total)

**4-tier matrix:**
```
Off-season weekday    (비수기 주중)
Off-season weekend    (비수기 주말)
Peak-season weekday   (성수기 주중)
Peak-season weekend   (성수기 주말)
```

Season boundaries are configurable by the admin (e.g., July 15 – August 31 = peak season). Weekend = Friday + Saturday nights. Each night in a booking may have a different price tier.

**Important:** Price is calculated at booking time and stored on the reservation. Do not recalculate from live pricing rules after payment — use the stored price.

#### PaymentService
**Responsibilities:**
- Initiate payment order with Toss Payments or KakaoPay
- Verify payment webhook callbacks (amount matching, order ID validation)
- Handle partial refunds on cancellation (if within refund window)
- Map payment status to reservation status

**Integration pattern:**
```
1. Client calls /api/payment/initiate
   → Creates reservation with status: PENDING_PAYMENT
   → Creates payment order on PG side
   → Returns PG order ID + client key to frontend

2. Frontend completes payment in PG SDK widget

3. PG calls /api/payment/webhook (server-to-server)
   → Verify signature + amount
   → Update reservation status: CONFIRMED
   → Trigger NotificationService

4. Frontend polls /api/booking/[id] for status update
   (or uses webhook-triggered server push if available)
```

Never trust client-reported payment success. Always verify via webhook.

#### NotificationService
**Responsibilities:**
- Send Kakao AlimTalk messages via Kakao Business API
- Queue and retry failed sends
- Record send history (recipient, template, sent_at, success/fail)

**AlimTalk templates needed:**
- 예약 확인 (Booking confirmation) — sent on CONFIRMED status
- 예약 취소 (Cancellation notice) — sent on cancellation
- 체크인 리마인더 (Check-in reminder) — sent D-1 via scheduled job
- 리뷰 요청 (Review request) — sent D+1 after check-out

**Scheduled jobs:** Reminders require a cron-like scheduler. Options: Vercel Cron Jobs (if hosted on Vercel), or a lightweight queue approach using `node-cron` on a long-running server.

#### ReviewService
**Responsibilities:**
- Accept review submission (tied to a completed reservation)
- Prevent duplicate reviews per reservation
- Fetch reviews for public display
- Admin: approve/reject, reply to reviews

---

### 5. Data Access Layer (Prisma ORM)

All database queries go through Prisma. No raw SQL in route handlers or service layer — only in Prisma migrations if needed for performance. This ensures type safety and migration tracking.

---

## Data Models

### Core Entities

```
SiteType (객실 유형)
  id, name, description, capacity, photos[], basePrice, active

Site (객실 단위)
  id, siteTypeId, name, description, active

SeasonRule (시즌 규칙)
  id, name, startDate, endDate
  // e.g., "2026 성수기: 2026-07-15 ~ 2026-08-31"

PricingMatrix (가격 매트릭스)
  id, siteTypeId, seasonRuleId(nullable=비수기), dayType(WEEKDAY|WEEKEND), price
  // 4 rows per siteType × season combination

DateBlock (날짜 차단 - 관리자 수동)
  id, siteId, date, reason

Addon (부대시설)
  id, name, description, price, unit(PER_BOOKING|PER_NIGHT|PER_PERSON), stock, active

Customer (고객)
  id, name, phone(encrypted), email, createdAt

Reservation (예약)
  id, customerId, siteId
  checkIn, checkOut
  status (PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED)
  totalPrice (stored at booking time)
  paymentOrderId
  createdAt, confirmedAt, cancelledAt

ReservationAddon (예약-부대시설 연결)
  id, reservationId, addonId, quantity, unitPrice (stored at booking time)

Payment (결제)
  id, reservationId, pgProvider(TOSS|KAKAO), pgOrderId, pgPaymentKey
  amount, status, paidAt, refundedAt, refundAmount

Notification (알림 이력)
  id, reservationId(nullable), customerId, template, sentAt, success, errorMsg

Review (리뷰)
  id, reservationId, customerId, rating(1-5), body, adminReply, publishedAt, status(PENDING|PUBLISHED|REJECTED)
```

### Key Constraints

- `Reservation` stores `totalPrice` and each `ReservationAddon` stores `unitPrice` — snapshot at booking time, immune to future price changes.
- `Customer.phone` should be encrypted at rest (PII protection, Korean PIPA/개인정보보호법).
- `Site` vs `SiteType`: SiteType = "Glamping Dome A-type" (shared photos/description). Site = actual bookable unit ("Dome #1", "Dome #2"). This allows multiple identical sites under one type.
- `PricingMatrix` with nullable `seasonRuleId` = base pricing (비수기). Non-null seasonRuleId = override for that season.

---

## Data Flow

### Booking Flow (Happy Path)

```
Customer → selects dates on calendar
         ↓
         GET /api/sites/[id]/availability
         ← AvailabilityService computes from Reservations table
         ↓
Customer → selects add-ons
         ↓
         POST /api/pricing/calculate
         ← PricingEngine iterates nights, applies season matrix, sums add-ons
         ← Returns itemized price breakdown
         ↓
Customer → fills contact info, submits
         ↓
         POST /api/booking/initiate
         ← BookingService: BEGIN TRANSACTION
             check availability again (race condition prevention)
             create Reservation(status=PENDING_PAYMENT)
             create ReservationAddons (with snapshotted prices)
             create Payment record
           END TRANSACTION
         ← PaymentService: create PG order
         ← Return {pgOrderId, clientKey, reservationId} to frontend
         ↓
Customer → completes payment in PG widget (Toss/Kakao SDK)
         ↓
PG Server → POST /api/payment/webhook
           ← PaymentService verifies signature + amount
           ← Update Reservation(status=CONFIRMED)
           ← Update Payment(paidAt, pgPaymentKey)
           ← NotificationService sends AlimTalk confirmation
         ↓
Customer → polls GET /api/booking/[id] → sees CONFIRMED
         → Redirected to /booking/confirm
```

### Cancellation Flow

```
Admin OR Customer → POST /api/booking/[id]/cancel
                  ← BookingService validates cancellation eligibility
                  ← PaymentService initiates PG refund (if applicable)
                  ← Update Reservation(status=CANCELLED)
                  ← NotificationService sends cancellation AlimTalk
                  ← AvailabilityService: dates now available again (automatic — derived from reservations)
```

### Availability Computation Flow

```
GET /api/sites/[id]/availability?from=2026-07-01&to=2026-07-31
  ← Query: all CONFIRMED or PENDING_PAYMENT reservations for this site
      overlapping the date range
  ← For each day in range:
      blocked = any reservation covers this date
              OR DateBlock row exists for this date
  ← Return: { "2026-07-01": "available", "2026-07-02": "blocked", ... }
```

PENDING_PAYMENT reservations should block dates but expire after ~15 minutes (configurable). A cleanup job or lazy check during availability computation handles expiry.

### Admin Dashboard Data Flow

```
GET /api/admin/dashboard
  ← Parallel queries:
      revenue_today = SUM(Reservation.totalPrice WHERE confirmedAt=today)
      revenue_month = SUM(Reservation.totalPrice WHERE confirmedAt=this_month)
      occupancy_rate = confirmed_nights / (total_site_nights) for period
      checkins_today = Reservation WHERE checkIn=today AND status=CONFIRMED
      checkouts_today = Reservation WHERE checkOut=today AND status=CONFIRMED
  ← Aggregate and return as single dashboard payload
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pre-populated Availability Table

**What:** Creating a row for every site-date combination (Site × 365 days) and updating them on booking.

**Why bad:** High maintenance overhead, sync bugs when cancellations happen, schema complexity. For a single campsite with few rooms, compute-on-read is fast enough.

**Instead:** Derive availability from Reservation rows at query time. Cache the result for 30 seconds in memory if performance becomes a concern.

---

### Anti-Pattern 2: Storing Price Rules Only (Not Snapshot)

**What:** Reservation stores only siteId + dates, then recalculates price from current pricing rules.

**Why bad:** If admin changes prices, past reservations show wrong amounts. Disputes become impossible to resolve. Revenue reports become unreliable.

**Instead:** Snapshot `totalPrice` and per-addon `unitPrice` onto the reservation at booking time. Pricing rules only affect future bookings.

---

### Anti-Pattern 3: Trusting Client-Reported Payment Success

**What:** Frontend completes payment in PG widget, POSTs "payment succeeded" to API, API confirms reservation.

**Why bad:** Trivially exploitable. Free bookings.

**Instead:** Only confirm reservations via server-to-server PG webhook. Verify amount matches expected. Verify signature/hash from PG.

---

### Anti-Pattern 4: Shared Admin/Public Session Logic

**What:** Using the same session/auth for both customer accounts and admin.

**Why bad:** A single-campsite site should not require customer accounts at all (friction). Admin is one person, use a simple separate auth mechanism.

**Instead:** No customer accounts for v1. Booking confirmation is linked by reservation ID + phone number lookup. Admin uses a hardcoded credentials login (NextAuth with credentials provider), separate from any public auth.

---

### Anti-Pattern 5: Mixing Business Logic into React Components

**What:** Pricing calculation, availability logic, or payment verification happening in frontend components.

**Why bad:** Duplicated logic, security bypass vectors, untestable.

**Instead:** All business logic in server-side service layer. Frontend only calls APIs and renders results.

---

## Build Order (Component Dependencies)

The components have clear dependency chains. Build in this order to avoid blocking yourself:

```
Stage 1 — Foundation (no dependencies)
  ├── Database schema + Prisma setup
  ├── SiteType/Site CRUD (admin)
  └── Addon CRUD (admin)

Stage 2 — Pricing Engine (depends on Stage 1 schema)
  ├── SeasonRule management (admin)
  ├── PricingMatrix management (admin)
  └── PricingEngine service (calculate given dates + add-ons)

Stage 3 — Availability + Calendar (depends on Stage 1 + 2)
  ├── AvailabilityService (compute from reservations)
  ├── DateBlock management (admin manual blocking)
  └── Public calendar UI (date picker + availability display)

Stage 4 — Booking Flow (depends on Stage 2 + 3)
  ├── BookingService (create reservation with PENDING_PAYMENT)
  ├── Booking initiation API
  └── Booking UI (site selection → add-ons → summary)

Stage 5 — Payment (depends on Stage 4)
  ├── PaymentService (PG integration)
  ├── Payment initiation endpoint
  ├── Payment webhook endpoint
  └── Confirmation page

Stage 6 — Notifications (depends on Stage 5)
  ├── NotificationService (Kakao AlimTalk)
  ├── Template setup (confirmation, cancellation, reminder)
  └── Scheduled reminder job (D-1 check-in, D+1 review request)

Stage 7 — Admin Operations (depends on Stage 4 + 5)
  ├── Reservation management (list, filter, cancel)
  ├── Customer management
  └── Dashboard (revenue, occupancy stats)

Stage 8 — Reviews (depends on Stage 5)
  ├── ReviewService
  ├── Post-checkout review submission
  └── Admin moderation + reply UI

Stage 9 — Public Site Polish (depends on Stage 1)
  ├── Campsite introduction pages
  ├── Photo galleries
  └── Location/facilities info pages
```

**Critical path:** Stage 1 → 2 → 3 → 4 → 5 is the mandatory spine. Everything else branches from it. Do not start payment integration before the booking flow is working end-to-end with a test payment.

---

## Scalability Considerations

This is a single campsite. Scale expectations are realistic: tens of reservations per day at peak, not thousands. Architecture decisions should reflect this.

| Concern | At this scale | If scaling ever needed |
|---------|--------------|----------------------|
| Availability compute | In-memory per request, fast | Add Redis cache for calendar data |
| Payment webhooks | Single Next.js instance handles fine | Separate webhook service + queue |
| Notifications | Synchronous send is acceptable | Queue with BullMQ + Redis |
| Database | Single PostgreSQL instance, sufficient | Read replica for dashboard queries |
| Images | Cloudflare R2 or similar object storage | CDN already handles distribution |

---

## Korean-Specific Integration Notes

### Kakao AlimTalk

**API:** Kakao Business Messaging API (카카오 비즈니스 메시지)

**Requirement:** Must register as Kakao Business sender (카카오 비즈니스 채널 등록) before API access. Template messages must be pre-approved by Kakao. Allow 1-2 week lead time for approval.

**Integration approach:** Use the official REST API directly, or via a Korean messaging middleware provider (NHN Cloud KakaoTalk, Bizmsg, etc.) which simplifies template management. NHN Cloud is the most common choice for B2B AlimTalk in Korea.

**Confidence:** MEDIUM — API specifics change; verify current SDK/REST endpoint documentation at time of implementation.

### Toss Payments

**SDK:** `@tosspayments/payment-sdk` (browser) + server-side REST API for webhook verification.

**Flow:** Toss Payments v2 uses a widget-based checkout. The frontend mounts the widget with an `amount` and `orderId`. On success, Toss calls your webhook URL server-to-server.

**Confidence:** MEDIUM — verify current SDK version and webhook format in Toss developer docs at implementation time.

### Personal Information Protection

**Requirement:** Korean PIPA (개인정보보호법) applies. Customer phone numbers and emails are PII.

**Minimum compliance actions:**
- Encrypt phone numbers at rest in database
- Privacy policy page (개인정보처리방침) is legally required
- Collect only what is necessary (name, phone, email for booking)
- Define and display retention period

---

## Sources

- Architecture patterns: Training knowledge — Next.js App Router monolith patterns (HIGH confidence for Next.js structure; established 2023-2025 pattern)
- Booking system availability modeling: Industry-standard "compute from reservations" pattern (HIGH confidence)
- Payment webhook security: PCI-DSS best practices + Toss Payments documentation patterns (HIGH confidence for principle; MEDIUM for Toss-specific API)
- Kakao AlimTalk: Training knowledge of Korean B2B messaging ecosystem (MEDIUM — verify current registration process and API at implementation)
- Korean PIPA compliance: Training knowledge (MEDIUM — verify current enforcement guidance)
- Pricing snapshot pattern: Standard e-commerce pattern, universally applicable (HIGH confidence)
