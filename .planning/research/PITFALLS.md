# Domain Pitfalls: Korean Camping Reservation Website

**Domain:** Single-campsite reservation + payment system (Korea market)
**Project:** CampingSite (단일 캠핑장 온라인 예약 시스템)
**Researched:** 2026-04-06
**Confidence:** MEDIUM-HIGH (based on training knowledge through Aug 2025; WebSearch unavailable)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, financial disputes, or angry customers.

---

### Pitfall 1: Double Booking via Race Condition

**What goes wrong:**
Two customers simultaneously see the same site as "available," both complete checkout, and both receive confirmation — but only one slot exists. This is the single most common fatal flaw in homegrown booking systems.

**Why it happens:**
The naive implementation checks availability at page load (or even at cart-add time), then deducts inventory only after payment succeeds. Between the availability check and the deduction, another transaction can slip through.

**Consequences:**
- Two confirmed reservations for the same room on the same date
- Operator must manually cancel one; reputation damage is severe in Korean camping communities (Naver Cafe, Instagram reviews spread fast)
- Refund processing is painful with Korean PGs due to partial refund complexity

**Prevention:**
- Use a **pessimistic lock or atomic reservation pattern**: when the customer begins checkout (not when they browse), atomically insert a `reservation_hold` row with a short TTL (e.g., 10 minutes). Use `INSERT ... WHERE NOT EXISTS` with a DB-level unique constraint on `(site_id, check_in_date, check_out_date)` range overlap.
- For PostgreSQL: use `FOR UPDATE SKIP LOCKED` on the availability query during checkout initiation.
- The unique constraint must cover date *ranges*, not just single dates. Use an exclusion constraint with `&&` range overlap operator in PostgreSQL, or a well-tested application-level range check inside a serializable transaction.
- Release the hold on payment failure, timeout, or abandonment (background job with cron/pg_cron).

**Detection (warning signs):**
- Availability check and payment confirmation are in separate transactions
- No database-level uniqueness enforcement on booking ranges
- Hold/lock mechanism absent from the data model

**Phase:** Core booking flow (Phase 1 or 2 — must be solved before payment integration)

---

### Pitfall 2: Payment Webhook / Callback Trust Without Verification

**What goes wrong:**
The server receives a payment success callback from TossPay or KakaoPay and immediately marks the reservation confirmed — without re-verifying the payment amount and status via a server-to-server API call. An attacker can forge a success callback or replay a smaller-amount payment.

**Why it happens:**
Developers trust the client-side redirect or the webhook payload at face value to save a round trip.

**Consequences:**
- Bookings confirmed with ₩0 or partial payment
- Chargeback/fraud risk
- PG audit failure if the site processes significant volume

**Prevention:**
- **Always do a server-to-server payment inquiry** (`GET /v1/payments/{paymentKey}` for Toss, equivalent for Kakao) immediately after receiving any callback, before confirming the reservation.
- Compare `response.amount` against the stored order total (the amount you generated the payment intent with) — reject if they differ by even ₩1.
- Store `paymentKey` / `tid` as idempotency key to prevent replay confirmation.
- Implement webhook signature verification where the PG provides it (TossPay provides a `TOSS-SIGNATURE` header since 2024).

**Detection:**
- Confirmation logic triggered directly from redirect URL parameters or client POST body
- No server-to-server verification API call in the payment confirmation handler

**Phase:** Payment integration phase — non-negotiable before go-live

---

### Pitfall 3: TossPay/KakaoPay Partial Cancel vs Full Cancel Confusion

**What goes wrong:**
Korean PGs treat partial cancellation (부분 취소) fundamentally differently from full cancellation, requiring separate API calls with different parameter shapes. Many developers implement only full cancel and discover partial cancel is needed (e.g., customer removes one add-on after booking) — requiring a rewrite of the cancellation flow.

**Why it happens:**
The happy-path demo always shows full cancellation. Partial cancel documentation is buried and its behavior differs per payment method (카드 partial cancel works; 가상계좌 partial cancel has restrictions).

**Consequences:**
- Operator must manually issue refunds via PG dashboard when partial cancel isn't implemented
- ₩ accounting discrepancies between your DB and PG settlement reports
- 가상계좌(virtual account) refunds require the customer's bank account number — storing this securely is an additional compliance concern

**Prevention:**
- Design the cancellation model upfront: enumerate all cancellation scenarios (full reservation cancel, remove one add-on, date change = cancel + rebook).
- For TossPay: `POST /v1/payments/{paymentKey}/cancel` with `cancelAmount` field. Test with real sandbox credentials — behavior differs from mock.
- For KakaoPay: `POST /v1/payment/cancel` with `cancel_amount` + `cancel_tax_free_amount`. Tax-free amount tracking is mandatory for correct partial cancel.
- Implement a `payment_cancellations` table tracking each partial cancel so running totals never exceed the original charge.
- Decide early: does "remove an add-on after booking" trigger a partial PG cancel, or a credit/coupon on next booking? Each path has different complexity.

**Detection:**
- Cancellation API only has a "full cancel" code path
- No `cancel_amount` tracking in the payments table
- No test coverage for partial cancellation scenarios

**Phase:** Payment integration + cancellation policy design (same phase)

---

### Pitfall 4: Seasonal Pricing Applied at Wrong Point in Time

**What goes wrong:**
The price shown to the customer at browse time is correct, but the price charged at payment time differs because the seasonal pricing record was updated between browse and checkout. Or, after a reservation is confirmed, the admin changes the season pricing, and the stored booking shows the new price — causing accounting confusion.

**Why it happens:**
Pricing is looked up dynamically (JOIN against current season table) instead of being snapshotted at booking creation.

**Consequences:**
- Customer disputes ("I was shown ₩80,000 but charged ₩120,000")
- Season-end price changes silently alter historical booking records
- Settlement reports don't match PG records

**Prevention:**
- **Snapshot the price at order creation.** The `reservations` table must store `unit_price_at_booking`, `addon_prices_at_booking` (or a JSON snapshot), `season_type` as immutable columns.
- Never re-derive price from current season tables when displaying a confirmed booking or processing payment.
- The 4-season pricing model (비수기주중/비수기주말/성수기주중/성수기주말) means a single multi-night stay can span multiple pricing tiers — calculate day-by-day and sum, snapshot the total breakdown.
- Multi-night spans crossing a season boundary (e.g., checking in on a 비수기 Thursday, checking out on a 성수기 Saturday) must be handled explicitly — decide and document the business rule before writing code.

**Detection:**
- `reservations` table has no price columns, only FKs to pricing tables
- Price is re-calculated on every page render for confirmed bookings
- No explicit handling of multi-night season boundary crossing in pricing logic

**Phase:** Data modeling (Phase 1) — pricing snapshot is a schema decision

---

### Pitfall 5: Kakao AlimTalk Template Pre-approval Delay

**What goes wrong:**
AlimTalk (카카오 알림톡) messages require **prior template approval** from Kakao. Templates take 2–5 business days to approve and can be rejected if the wording doesn't match Kakao's guidelines. Developers discover this days before launch when they try to send the first message.

**Why it happens:**
AlimTalk is confused with general Kakao message APIs. Unlike SMS, you cannot send arbitrary text — only pre-approved templates with specific variable slots.

**Consequences:**
- Launch blocked by pending template approval
- Approved templates cannot be changed without re-approval; last-minute wording changes require another 2–5 day wait
- Template variables (`#{예약번호}`, `#{체크인날짜}`) must exactly match approved template — any mismatch causes API error

**Prevention:**
- Submit AlimTalk templates in the **first development sprint**, not after the notification feature is "ready."
- Required templates for this project:
  1. 예약 확인 (Booking confirmation) — include `#{예약번호}`, `#{객실명}`, `#{체크인날짜}`, `#{체크아웃날짜}`, `#{총금액}`
  2. 예약 리마인더 (Check-in reminder, sent D-1)
  3. 예약 취소 확인
  4. (Optional) 결제 완료
- Register as a KakaoTalk channel (카카오톡 채널) first — AlimTalk requires an approved channel. This process itself takes additional days.
- Use a KakaoTalk Business Message (BM) certified partner API provider (e.g., NHN Cloud, Coolsms, Solapi, Bizppurio) — do NOT attempt direct Kakao API access without a BM partner.
- Keep a fallback SMS path: if AlimTalk fails (user doesn't have KakaoTalk, or API error), fall back to LMS/SMS via the same provider.

**Detection:**
- AlimTalk templates not submitted during early development
- No KakaoTalk channel registered
- No SMS fallback in the notification code path

**Phase:** Notification feature — template submission in Phase 1 or 2 even if the feature ships later

---

### Pitfall 6: Korea Standard Time Timezone Confusion

**What goes wrong:**
Check-in/check-out dates stored as UTC timestamps rather than KST (Korea Standard Time, UTC+9) dates. A check-in of "2026-07-15 00:00 KST" stored as UTC becomes "2026-07-14 15:00 UTC" — and when displayed in certain locales or queried in UTC date ranges, the date appears to be July 14th.

**Why it happens:**
Developers use `TIMESTAMP WITH TIME ZONE` and default UTC storage (which is usually correct for global apps) but forget that camping check-in/out are **local date concepts**, not moments in time.

**Consequences:**
- Availability calendar shows wrong dates in admin panel
- Reservation reminder sent a day early or late
- `GROUP BY DATE(created_at)` in analytics produces wrong daily counts

**Prevention:**
- Store check-in and check-out as **`DATE` type** (not timestamp), not timezone-aware. A check-in date is "July 15th" regardless of what time the customer actually arrives.
- For events that are true moments in time (payment created, message sent), use `TIMESTAMP WITH TIME ZONE` stored in UTC, but always render in KST for the admin panel.
- Set the database session timezone to `Asia/Seoul` for any date arithmetic queries, or use explicit `AT TIME ZONE 'Asia/Seoul'` in SQL.
- In JavaScript/TypeScript: use `date-fns-tz` or `dayjs` with timezone plugin for all date formatting. Never use `new Date().toLocaleDateString()` without an explicit `timeZone: 'Asia/Seoul'` option.
- Availability range queries: `check_in_date <= :requested_date AND check_out_date > :requested_date` (check-out day is departure, not an occupied night).

**Detection:**
- Check-in/check-out columns are `TIMESTAMP` or `TIMESTAMPTZ` instead of `DATE`
- Date formatting uses no explicit timezone
- Tests pass with UTC system clock but fail when clock is near midnight KST

**Phase:** Data modeling (Phase 1) — date type choice is schema-level

---

## Moderate Pitfalls

---

### Pitfall 7: Add-on Inventory Not Properly Tracked

**What goes wrong:**
Add-ons like grills, firepits (화로대), and lanterns have finite stock — but the system treats them as unlimited. On busy summer weekends, 15 groups all book 5 grills when only 8 exist.

**Why it happens:**
Add-ons are modeled as a simple price list, not inventory items with per-date stock tracking.

**Prevention:**
- Model add-ons with a `daily_stock` per item, or at minimum a global `max_quantity`.
- When a reservation is confirmed, decrement `addon_inventory` for each date in the stay range.
- On reservation cancellation, restore the inventory atomically.
- Admin panel must show add-on inventory status per date.
- For items with truly unlimited stock (장작/firewood purchased per bundle), mark them as `unlimited = true` to skip inventory check.

**Detection:**
- `addons` table has no quantity/stock column
- No inventory decrement in the reservation confirmation flow

**Phase:** Booking flow data model (Phase 1–2)

---

### Pitfall 8: Admin Panel Has No Route-Level Authorization

**What goes wrong:**
The admin panel routes are protected client-side (redirect if not logged in), but the API endpoints are not independently authenticated. Anyone who knows the API URL can call `GET /api/admin/reservations` without a valid session.

**Why it happens:**
Next.js app router middleware sometimes gets misconfigured; developers rely on layout-level redirects and forget to add server-side auth checks to API route handlers.

**Prevention:**
- Every admin API route handler must call `getServerSession()` (NextAuth) or validate a JWT/session token as the **first line** — before any DB query.
- Apply a global middleware pattern: a helper `requireAdmin(req)` that throws 401/403, used in every admin route.
- Principle: the admin UI is convenience — the API is the real guard.
- Test by calling admin endpoints directly with curl (no cookies). All should return 401.
- Separate admin routes under `/api/admin/` prefix and apply middleware globally to that prefix.

**Detection:**
- API routes rely on client-side redirect state to determine if user is authenticated
- No session/token check at the top of admin route handlers

**Phase:** Auth implementation (early phase, applies to all admin features)

---

### Pitfall 9: Vague Cancellation Policy Causes Chargeback Disputes

**What goes wrong:**
The cancellation policy (e.g., "7 days before = full refund, 3 days before = 50%, same day = no refund") is stored as a hard-coded comment or in a config file — not enforced by code. Operator manually processes refunds based on memory, creating inconsistency. Customers file chargebacks with their card issuer when they feel the refund was wrong.

**Why it happens:**
Cancellation policy feels like a "policy" problem, not a "code" problem — until it's too late.

**Prevention:**
- Model the cancellation policy as data: a `cancellation_policy` table with entries like `{ days_before_checkin: 7, refund_percent: 100 }`.
- When a cancellation is requested, the system calculates the refund amount automatically based on current date vs check-in date.
- Display the calculated refund amount on the cancellation confirmation screen so the customer explicitly sees it before confirming.
- The admin panel must show the refund amount before processing, not after.
- Korean PG chargebacks (이의제기): keep a log of every cancellation request with timestamp, customer acknowledgment of refund terms, and the refund amount calculated — this is your evidence in a dispute.

**Detection:**
- No cancellation policy table in the data model
- Refund amount is calculated manually by the operator

**Phase:** Booking model + payment integration (Phase 2–3)

---

### Pitfall 10: Mobile Calendar UX Breaks on iOS Safari

**What goes wrong:**
Date range pickers (check-in / check-out calendar) built with desktop-first libraries render poorly on iOS Safari — tap targets are too small, month navigation is broken, or the date range selection requires hover (which doesn't exist on touch).

**Why it happens:**
Most Korean camping customers book on mobile (KakaoTalk links, Instagram ads → mobile browser). Desktop-tested UX misses the primary usage context.

**Prevention:**
- Choose a date picker component that is explicitly tested for mobile touch (e.g., `react-day-picker` v8+, or a purpose-built mobile calendar).
- Tap targets for individual day cells must be at least 44x44px (Apple HIG minimum).
- Test check-in/check-out flow on a real iPhone (not just Chrome DevTools mobile emulation) — iOS Safari has unique quirks with scroll-lock, bottom safe area insets, and `position: fixed` behavior.
- Avoid using `<input type="date">` for a custom range picker — iOS renders it as a native spinner which is confusing for range selection.
- The "select check-in, then check-out" two-tap flow must visually communicate state clearly (which date is selected, what the range looks like).

**Detection:**
- Calendar tested only on desktop Chrome
- Date picker library has no documented mobile/touch support
- Day cells smaller than 44px

**Phase:** Frontend booking UI (Phase 2)

---

### Pitfall 11: KakaoPay Requires Business Registration (사업자등록증) Verification

**What goes wrong:**
KakaoPay and TossPay merchant signup requires a verified Korean business registration (사업자등록증) and may require additional documents for specific business categories (숙박업 = accommodation). This process can take 2–4 weeks. Developers treat PG integration as a purely technical task and discover the business verification bottleneck late.

**Why it happens:**
The documentation (in English) focuses on the API. The merchant onboarding requirements are in Korean and managed through a separate business approval process.

**Prevention:**
- Start PG merchant account applications (both TossPay and KakaoPay) as early as possible — before the payment feature is ready to integrate.
- For TossPay: apply at `https://merchant.tosspayments.com`. Sandbox credentials are available immediately; production credentials require business verification.
- For KakaoPay: apply through Kakao Business. Note: KakaoPay for online payments uses a different channel from KakaoPay in-person.
- Use TossPay sandbox extensively during development so you're not blocked waiting for production credentials.
- Budget: TossPay charges approximately 1.4–3.3% per transaction (varies by card type); KakaoPay charges similar rates. Factor this into pricing.

**Detection:**
- PG merchant applications not started until development is complete
- No sandbox credentials in the development environment

**Phase:** Pre-integration planning — apply in Phase 1, integrate in Phase 3

---

### Pitfall 12: 가상계좌 (Virtual Account) Payment Expiry Not Handled

**What goes wrong:**
Korean customers sometimes choose 가상계좌 (virtual account / bank transfer) as a payment method. The customer receives a temporary bank account number and must transfer money within a deadline (typically 24–72 hours). If they never transfer, the reservation should be released — but many systems leave it in a "pending" state forever, blocking that site's availability calendar.

**Why it happens:**
Virtual account payments are asynchronous — success is a webhook event that arrives hours later, not a redirect. Developers test only with card payments (synchronous) and forget the async path.

**Prevention:**
- Implement a webhook handler for 가상계좌 deposit confirmation. TossPay sends `VIRTUAL_ACCOUNT_TRANSFER_COMPLETED` webhook; set it up from day one.
- Schedule an expiry job: if `status = 'pending_virtual_account'` and `expires_at < NOW()`, release the hold and set status to `'expired'`.
- Show virtual account details (bank name, account number, amount, deadline) clearly in the booking confirmation email/AlimTalk.
- Send a reminder AlimTalk 2 hours before the virtual account expires.
- Decide business rule: does virtual account expiry release the AlimTalk reminder that was already scheduled? Yes — cancel pending notifications for expired reservations.

**Detection:**
- No webhook endpoint for virtual account deposit events
- No expiry cron job for pending virtual account reservations
- Reservation hold not released on virtual account expiry

**Phase:** Payment integration (same phase as card payment, not after)

---

## Minor Pitfalls

---

### Pitfall 13: Review System Allows Fake Reviews Without Booking Verification

**What goes wrong:**
The review form is accessible to anyone, allowing competitors or trolls to post fake negative reviews. Or, the opposite: the operator can review their own campsite.

**Prevention:**
- Reviews must be gated on a confirmed + completed reservation (`check_out_date < TODAY()` and `status = 'completed'`).
- Each reservation can submit at most one review (unique constraint on `reservation_id`).
- Admin review replies should be visually distinct from customer reviews.

**Phase:** Review feature (later phase)

---

### Pitfall 14: Image Upload Without Size/Format Limits Causes Storage Bloat

**What goes wrong:**
Operator uploads original 24MP DSLR photos (15MB each) directly to the server or S3. The customer-facing gallery loads slowly, and storage costs balloon.

**Prevention:**
- Enforce server-side upload limits (e.g., max 10MB per file, only JPEG/PNG/WEBP).
- Auto-convert and resize to multiple sizes on upload (thumbnail 400px, medium 1200px, original).
- Use `sharp` (Node.js) for server-side processing or an image CDN (Cloudflare Images, AWS CloudFront + Lambda@Edge).
- Store processed URLs in the database, not raw upload paths.

**Phase:** Admin panel (accommodation management feature)

---

### Pitfall 15: No Idempotency for AlimTalk Sends Causes Duplicate Messages

**What goes wrong:**
A network timeout causes the AlimTalk API call to be retried, and the customer receives two identical booking confirmation messages. For Korean users, duplicate AlimTalk messages are a visible trust signal — it signals a poorly made system.

**Prevention:**
- Assign a unique `message_id` (e.g., `booking_{reservationId}_{templateId}_{timestamp}`) to each AlimTalk send attempt.
- Track sent messages in a `notification_log` table with `(reservation_id, template_id)` unique constraint.
- Before sending, check if a successful send already exists for this `(reservation_id, template_id)` combination.
- Use the BM partner's idempotency key feature if available.

**Phase:** Notification integration

---

### Pitfall 16: Admin Dashboard Date Filtering Uses Server Time Not KST

**What goes wrong:**
The "오늘의 입퇴실 현황" (today's check-in/check-out status) dashboard widget fetches records where `check_in_date = CURRENT_DATE`. If the server is in UTC, `CURRENT_DATE` returns the wrong date for the first 9 hours of KST morning.

**Prevention:**
- Always pass explicit KST dates from the client, or always use `CURRENT_DATE AT TIME ZONE 'Asia/Seoul'` in server-side queries.
- Set `timezone = 'Asia/Seoul'` in PostgreSQL connection config for the application.

**Phase:** Admin dashboard (applies to all date-based queries)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data modeling / schema design | Pricing not snapshotted (Pitfall 4); wrong date type (Pitfall 6); add-on inventory missing (Pitfall 7) | Model price snapshots and `DATE` type from day one |
| Booking flow implementation | Race condition / double booking (Pitfall 1) | Use DB-level range exclusion constraint + hold pattern before writing any booking logic |
| Payment integration | Webhook forgery (Pitfall 2); partial cancel complexity (Pitfall 3); virtual account async (Pitfall 12); merchant approval delay (Pitfall 11) | Start PG merchant applications early; build server-to-server verification first |
| AlimTalk / notifications | Template approval delay (Pitfall 5); duplicate sends (Pitfall 15) | Submit templates in sprint 1; build notification_log table |
| Admin panel | Route-level auth gap (Pitfall 8) | Apply `requireAdmin()` middleware to every admin API route from the start |
| Cancellation flow | Policy not enforced in code (Pitfall 9) | Model cancellation policy as data early; calculate refund amount at cancel time |
| Frontend calendar | Mobile iOS Safari breakage (Pitfall 10) | Choose touch-tested date picker; test on real iOS device |
| Admin dashboard | KST date filter wrong (Pitfall 16) | Set DB session timezone; always use explicit KST dates |
| Image management | Storage bloat (Pitfall 14) | Enforce limits and resize on upload |
| Review system | Unverified reviews (Pitfall 13) | Gate on completed reservations from the start |

---

## Korean Market-Specific Notes

These pitfalls are specific to the Korean context and may not appear in generic booking system guides:

1. **AlimTalk is not optional.** Korean camping customers expect KakaoTalk notifications — SMS alone is considered low-quality. But AlimTalk requires pre-approval infrastructure that must be started early.

2. **KakaoPay checkout UX is expected.** Korean mobile users expect to see the KakaoPay blue button. Omitting it reduces conversion, as many Korean users do not have their card details memorized.

3. **가상계좌 is a common payment method for older Korean demographics.** Ignoring it means excluding a significant portion of the customer base, especially those who don't have internationally valid credit cards.

4. **Naver Map integration is expected** (out of scope for v1, but when building the location page, Korean users expect a Naver Map embed, not Google Maps).

5. **Personal Information Protection Act (개인정보보호법):** Collecting customer phone numbers and names for AlimTalk requires explicit consent (개인정보 수집·이용 동의) displayed at booking time. This is a legal requirement, not optional.

6. **Business hours assumption:** Korean camping customers frequently make late-night bookings (10pm–midnight). The system must be fully self-service — no "booking pending admin approval" flow that creates delays.

---

## Sources

- Training knowledge (Korean PG integrations: TossPay, KakaoPay documentation through Aug 2025) — MEDIUM confidence
- Training knowledge (Kakao AlimTalk / BizMessage ecosystem and approval process) — MEDIUM confidence
- Training knowledge (PostgreSQL range exclusion constraints, serializable transactions) — HIGH confidence
- Training knowledge (Korean e-commerce and accommodation law, 개인정보보호법) — MEDIUM confidence
- Training knowledge (Next.js App Router middleware auth patterns) — HIGH confidence
- Training knowledge (Korean mobile usage patterns for booking) — MEDIUM confidence

**Note:** WebSearch was unavailable during this research session. Claims marked MEDIUM confidence should be verified against current TossPay (`https://docs.tosspayments.com`) and KakaoPay developer documentation, and the current Kakao Business channel approval process, before implementation.
