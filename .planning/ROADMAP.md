# Roadmap: CampingSite

**Project:** 단일 캠핑장 온라인 예약 시스템
**Milestone:** v1 — Full reservation and payment system
**Granularity:** Fine
**Total Requirements:** 43 v1 requirements
**Created:** 2026-04-06

---

## Phases

- [ ] **Phase 1: Foundation** - Schema, admin auth, site/add-on CRUD, Cloudflare R2 image upload
- [ ] **Phase 2: Pricing Engine** - 4-tier seasonal pricing configuration and calculation logic
- [ ] **Phase 3: Availability Engine** - Real-time availability, anti-collision, date blocking rules
- [ ] **Phase 4: Public Booking Flow** - Customer-facing multi-step booking UI from calendar to confirmation
- [ ] **Phase 5: Booking Lookup & Cancellation** - Reservation lookup and customer-initiated cancellation
- [ ] **Phase 6: Payment Integration** - Toss Payments full flow: card/KakaoPay/TossPay, webhook, refunds
- [ ] **Phase 7: Admin Reservation Management** - Reservation list, detail, tape chart, manual create/cancel
- [ ] **Phase 8: Admin Dashboard & Customer** - Dashboard KPIs, revenue summary, customer list
- [ ] **Phase 9: Reviews** - Post-stay review submission and admin reply
- [ ] **Phase 10: Public Info Pages** - Static info, location map, rules, mobile responsiveness

---

## Phase Details

### Phase 1: Foundation
**Goal**: Admin can log in, manage site types with photos, and configure add-on items — all backed by a schema that is correct from day one
**Depends on**: Nothing (first phase)
**Requirements**: SITE-01, SITE-02, ADDON-01, ADDON-02, ADDON-04
**Success Criteria** (what must be TRUE):
  1. Admin can log in with credentials and access the admin panel; unauthenticated requests to `/admin/*` routes are rejected with 401
  2. Admin can create, edit, and delete a site type (e.g., 글램핑 돔) with name, description, capacity, amenities, and photo upload; photos persist in Cloudflare R2
  3. Admin can create, edit an add-on item with name, price, photo, max daily quantity, and price type (건당/인당/박당)
  4. Admin can activate or deactivate any add-on item; deactivated items are not visible to customers
  5. Database schema includes price-snapshot columns, DATE types for check-in/check-out, encrypted phone field, and range-exclusion constraint scaffolding — confirmed via Prisma migration success
**Plans**: 5 plans
Plans:
- [x] 01-01-PLAN.md — Bootstrap, Prisma schema, R2 client, field encryption
- [ ] 01-02-PLAN.md — Admin auth (JWT cookie, env credentials, middleware, login page)
- [ ] 01-03-PLAN.md — Admin shell layout (sidebar, route group, dashboard placeholder)
- [ ] 01-04-PLAN.md — Site type CRUD (API, photo upload, amenities checklist)
- [ ] 01-05-PLAN.md — Add-on CRUD (API, price types, activation toggle)
**UI hint**: yes

### Phase 2: Pricing Engine
**Goal**: The system correctly calculates the total price for any stay using 4-tier seasonal rules, per-person surcharges, and add-on pricing
**Depends on**: Phase 1
**Requirements**: PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05
**Success Criteria** (what must be TRUE):
  1. Admin can define season date ranges (성수기/비수기) and set four nightly rates per site type (비수기주중, 비수기주말, 성수기주중, 성수기주말)
  2. A Friday or Saturday night is automatically priced at the weekend rate; all other nights use the weekday rate — no manual flag needed
  3. A stay spanning both peak and off-peak nights calculates correctly by summing each night's applicable rate
  4. When guest count exceeds the base capacity, the per-person surcharge is automatically applied per night and shown in the booking summary
  5. After a price rule is changed by admin, existing confirmed reservations display their original booking-time price without any change
**Plans**: TBD

### Phase 3: Availability Engine
**Goal**: Customers see accurate real-time availability and the system physically prevents any double-booking scenario
**Depends on**: Phase 1, Phase 2
**Requirements**: AVAIL-01, AVAIL-02, AVAIL-03, SITE-03, SITE-04
**Success Criteria** (what must be TRUE):
  1. When a reservation is confirmed for site X on dates D1–D3, those dates show as unavailable for site X immediately — with no page reload or cache flush required
  2. If two customers attempt to book the same site on overlapping dates simultaneously, exactly one succeeds; the database rejects the second via exclusion constraint, not application-layer logic
  3. During payment (PENDING_PAYMENT state), the site is held for 10 minutes; if payment is not completed, the hold expires automatically and the site becomes available again
  4. Admin can block specific dates on specific site types (e.g., 2026-07-15 for maintenance); blocked dates appear unavailable on the customer calendar
  5. Admin can set a minimum stay duration per site type (e.g., Friday night requires 2 nights); dates that would result in a stay shorter than minimum are unselectable in the calendar
**Plans**: TBD

### Phase 4: Public Booking Flow
**Goal**: A customer can go from selecting dates to submitting a complete booking with add-ons and see a full price breakdown — all from their phone
**Depends on**: Phase 2, Phase 3
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, ADDON-03
**Success Criteria** (what must be TRUE):
  1. Customer selects check-in and check-out dates on a mobile-friendly calendar (iOS Safari tested); unavailable and blocked dates are visually distinct and unselectable
  2. Customer sees only the site types available for those dates, each showing representative photo, capacity, amenities, and the per-night price for the selected season
  3. Customer can view a site's full detail page (photo carousel, description, full amenity list, pricing table) and select it for booking
  4. Customer enters adult/child counts; any per-person surcharge is recalculated and displayed instantly without a page reload
  5. Customer can add/remove add-on items (그릴, 장작, 화로대 등) from a cart-style selection; items with zero remaining daily stock are shown as sold out and unselectable
  6. Customer sees an order summary (site name, dates, nightly breakdown, add-ons, total) and can confirm booking by entering name, phone number, and (optional) special requests — creating a PENDING_PAYMENT reservation
**Plans**: TBD
**UI hint**: yes

### Phase 5: Booking Lookup & Cancellation
**Goal**: Customers can find their reservation and cancel it themselves with transparent refund calculation — no account required
**Depends on**: Phase 4
**Requirements**: BOOK-07, BOOK-08
**Success Criteria** (what must be TRUE):
  1. Customer enters a reservation number and phone number; the system returns full booking details (dates, site, add-ons, payment status, total paid) or a clear not-found message
  2. Customer can initiate cancellation from the lookup page; the cancellation policy and exact refund amount are shown before the customer confirms the cancellation
  3. After customer confirms cancellation, the reservation status changes to CANCELLED and the held dates are released for new bookings
**Plans**: TBD
**UI hint**: yes

### Phase 6: Payment Integration
**Goal**: Customers complete real payment through Toss Payments and the system verifies webhook authenticity before confirming any reservation
**Depends on**: Phase 4, Phase 5
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Success Criteria** (what must be TRUE):
  1. Customer can pay using card, KakaoPay, or TossPay through the Toss Payments widget (no redirect); the payment UI renders correctly on mobile
  2. After payment, the server verifies the payment with Toss Payments API server-to-server (amount matches stored total to the won, signature valid) before setting reservation to CONFIRMED — a forged client callback cannot confirm a reservation
  3. When a cancellation is initiated and qualifies for a refund, the system calls the Toss Payments cancellation API and updates the refund amount in the database; partial cancellations (e.g., removing an add-on) are tracked separately
  4. Admin can view a list of all payments and refunds with date, amount, PG transaction ID, and reservation reference; the list is filterable by date range and status
**Plans**: TBD

### Phase 7: Admin Reservation Management
**Goal**: Admin can see all reservations in every format needed for daily operations and handle any reservation lifecycle event
**Depends on**: Phase 6
**Requirements**: RESV-01, RESV-02, RESV-03, RESV-04, RESV-05
**Success Criteria** (what must be TRUE):
  1. Admin can view a list of all reservations filterable by check-in date range, reservation status, site type, and customer name/phone; results paginate correctly with many records
  2. Admin can open any reservation to see full details: customer info, selected site, dates, add-ons, payment history, and any cancellation record
  3. Admin can manually cancel a confirmed reservation from the detail view; the cancellation triggers a refund prompt with the policy-calculated refund amount
  4. Admin can manually create a reservation (phone/walk-in) by selecting site, dates, guest info, and add-ons — bypassing the payment widget and marking payment as offline
  5. Admin can view a tape chart (横一覧) showing all site types as rows and dates as columns, with each booking block color-coded by status — CONFIRMED, PENDING, CANCELLED
**Plans**: TBD
**UI hint**: yes

### Phase 8: Admin Dashboard & Customer
**Goal**: Admin sees actionable daily operations data at a glance and can look up any customer's history
**Depends on**: Phase 7
**Requirements**: DASH-01, DASH-02, DASH-03, CUST-01
**Success Criteria** (what must be TRUE):
  1. Admin dashboard shows today's expected check-ins and check-outs as separate lists with customer names and site names; current occupancy rate is displayed as a percentage
  2. Admin can view revenue totals for today, the current week, and the current month; figures update automatically based on KST date (not UTC)
  3. Admin sees a feed of recent booking and cancellation events (last 10); each item shows timestamp, customer name, site, and action type
  4. Admin can search the customer list by name or phone number and view that customer's complete reservation history (all bookings, statuses, and amounts)
**Plans**: TBD
**UI hint**: yes

### Phase 9: Reviews
**Goal**: Verified guests can leave reviews and admin can respond — creating a trust signal for future customers
**Depends on**: Phase 6
**Requirements**: REVW-01, REVW-02
**Success Criteria** (what must be TRUE):
  1. A customer whose check-out date has passed can submit a review (star rating 1–5 + text) by entering their reservation number and phone; the system rejects review attempts on reservations that are not COMPLETED or where check-out has not yet passed
  2. Each reservation can have at most one review; attempting to submit a second review for the same reservation is rejected
  3. Admin can see all reviews in the admin panel, write a reply to any review, and edit that reply; the reply is displayed publicly under the review
  4. Approved reviews with the admin reply are visible on the public-facing room detail page with aggregate star rating shown on room cards
**Plans**: TBD
**UI hint**: yes

### Phase 10: Public Info Pages
**Goal**: Visitors can learn about the campsite, find directions, read policies, and do all of this comfortably on a phone
**Depends on**: Phase 4
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. A campsite introduction page exists with sections for overview, facility descriptions, and nearby attractions — content is editable by admin without code changes
  2. A directions page displays an embedded map (Kakao Map or Naver Map) with the campsite pin, address, and parking instructions
  3. A rules and refund policy page clearly states check-in/check-out times, house rules, and the cancellation/refund schedule (required before payment under Korean Consumer Protection Act)
  4. All pages — booking flow, admin panel, info pages — render correctly and are usable on mobile screens (360px–430px width) without horizontal scrolling or broken layouts
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/5 | Planned | - |
| 2. Pricing Engine | 0/? | Not started | - |
| 3. Availability Engine | 0/? | Not started | - |
| 4. Public Booking Flow | 0/? | Not started | - |
| 5. Booking Lookup & Cancellation | 0/? | Not started | - |
| 6. Payment Integration | 0/? | Not started | - |
| 7. Admin Reservation Management | 0/? | Not started | - |
| 8. Admin Dashboard & Customer | 0/? | Not started | - |
| 9. Reviews | 0/? | Not started | - |
| 10. Public Info Pages | 0/? | Not started | - |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | Phase 1 | Pending |
| SITE-02 | Phase 1 | Pending |
| ADDON-01 | Phase 1 | Pending |
| ADDON-02 | Phase 1 | Pending |
| ADDON-04 | Phase 1 | Pending |
| PRICE-01 | Phase 2 | Pending |
| PRICE-02 | Phase 2 | Pending |
| PRICE-03 | Phase 2 | Pending |
| PRICE-04 | Phase 2 | Pending |
| PRICE-05 | Phase 2 | Pending |
| AVAIL-01 | Phase 3 | Pending |
| AVAIL-02 | Phase 3 | Pending |
| AVAIL-03 | Phase 3 | Pending |
| SITE-03 | Phase 3 | Pending |
| SITE-04 | Phase 3 | Pending |
| BOOK-01 | Phase 4 | Pending |
| BOOK-02 | Phase 4 | Pending |
| BOOK-03 | Phase 4 | Pending |
| BOOK-04 | Phase 4 | Pending |
| BOOK-05 | Phase 4 | Pending |
| BOOK-06 | Phase 4 | Pending |
| ADDON-03 | Phase 4 | Pending |
| BOOK-07 | Phase 5 | Pending |
| BOOK-08 | Phase 5 | Pending |
| PAY-01 | Phase 6 | Pending |
| PAY-02 | Phase 6 | Pending |
| PAY-03 | Phase 6 | Pending |
| PAY-04 | Phase 6 | Pending |
| RESV-01 | Phase 7 | Pending |
| RESV-02 | Phase 7 | Pending |
| RESV-03 | Phase 7 | Pending |
| RESV-04 | Phase 7 | Pending |
| RESV-05 | Phase 7 | Pending |
| DASH-01 | Phase 8 | Pending |
| DASH-02 | Phase 8 | Pending |
| DASH-03 | Phase 8 | Pending |
| CUST-01 | Phase 8 | Pending |
| REVW-01 | Phase 9 | Pending |
| REVW-02 | Phase 9 | Pending |
| PAGE-01 | Phase 10 | Pending |
| PAGE-02 | Phase 10 | Pending |
| PAGE-03 | Phase 10 | Pending |
| PAGE-04 | Phase 10 | Pending |

**Total mapped: 43/43**

---

*Roadmap created: 2026-04-06*
*Last updated: 2026-04-06 after initial creation*
