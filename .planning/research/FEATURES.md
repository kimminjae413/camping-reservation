# Feature Landscape

**Domain:** Single-site camping/glamping reservation website (Korean market)
**Researched:** 2026-04-06
**Confidence note:** Web search and WebFetch were unavailable. All findings are based on training knowledge (cutoff August 2025) of the Korean camping market, platforms such as Glampick, Naver SmartStore camping listings, AutoCamping, and general Korean e-commerce/reservation UX conventions. Confidence is marked per section.

---

## Table Stakes

Features users expect from any Korean camping reservation site. Missing any of these and users will leave or not trust the site.

### Booking & Availability

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Date-picker with real-time availability calendar | Every Korean camping reservation platform (글램픽, 오토캠핑 등) shows a calendar heatmap or availability grid | Medium | Calendar must block already-booked dates per room type; needs check-in/check-out logic (same-night exclusion) |
| Room/site type browsing with photos and capacity | Users won't book what they can't see; photo galleries are standard | Low-Medium | Carousel per room type, occupancy info, amenity tags |
| Minimum/maximum stay display | Many Korean glamping sites enforce 1-night minimum on weekdays, 2-night on holiday weekends | Low | Configurable per room type |
| Booking summary before payment | Itemized display: room + add-ons + dates + total | Low | Critical trust signal in Korean e-commerce |
| Reservation confirmation page + email/SMS | Users expect immediate post-payment confirmation | Low-Medium | Email is acceptable fallback; Kakao AlimTalk is the Korean standard |

### Pricing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 4-tier seasonal pricing (비수기주중 / 비수기주말 / 성수기주중 / 성수기주말) | Korean camping industry standard; all domestic platforms use this exact 4-tier nomenclature | Medium | Price matrix stored per room type; date classification engine needed to map any calendar date to one of four tiers |
| Per-person surcharge (인원 추가 요금) | Almost universal in Korean glamping; base price covers N persons, additional fee per extra person | Low-Medium | Optional per room type; needs headcount selector in booking flow |
| Price display in Korean Won (₩) with comma formatting | Korean locale expectation; ₩50,000 not $50 | Low | Locale formatting only |

### Add-on Facility Selection (부대시설)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cart-style add-on selection during booking | PROJECT.md explicitly defines this pattern; mirrors Korean BBQ/pension rental conventions | Medium | Add-ons (그릴, 장작, 화로대, 랜턴 등) selected during booking step 2; stored as line items on the reservation |
| Add-on quantity selector | Some items (장작 묶음, 숯) are sold in multiples | Low | Integer quantity input with min=0 |
| Add-on availability toggle | Seasonal or stock-based availability (e.g., rental bikes in winter) | Low | Admin-controlled active/inactive flag per add-on |
| Add-on subtotal in booking summary | Users expect itemized breakdown | Low | Computed from quantity × unit price |

### Payment

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Kakao Pay (카카오페이) | Dominant Korean mobile payment; users who camp tend to be mobile-first | Medium | Requires KG이니시스, 토스페이먼츠, or PortOne (구 아임포트) PG integration |
| Toss Pay (토스페이) | Second most expected Korean payment method; tosspayments is developer-friendly | Medium | Same PG gateway can handle both Kakao Pay and Toss Pay |
| Credit/debit card (신용카드/체크카드) | Baseline expectation; some users do not have Kakao Pay set up | Medium | Same PG gateway |
| Deposit or full payment at booking | Korean glamping sites typically collect full payment upfront for small operators | Low | Policy decision, not technical complexity |
| Cancellation/refund policy display | Korean Consumer Protection Act (소비자분쟁해결기준) requires refund policy to be clearly disclosed before payment | Low | Static content + policy stored on reservation for historical reference |

### Kakao AlimTalk Notifications (카카오 알림톡)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Booking confirmation AlimTalk | Korean users expect AlimTalk over email; 카카오 채널 is the de facto communication layer | Medium | Requires Kakao Business channel approval + AlimTalk API (비즈뿌리오, SOLAPI, 알리고 등) |
| Check-in reminder AlimTalk (D-1) | Standard on Korean accommodation platforms | Low-Medium | Scheduled job or cron triggered ~24h before check-in |
| Cancellation AlimTalk | Refund amount and cancellation date confirmation | Low | Triggered on admin cancel action |

### Review System

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Post-stay review (이용 후기) | All Korean accommodation platforms display reviews; absence creates distrust | Medium | Review only unlocked after reservation check-out date passes |
| Star rating (별점) 1–5 | Universal expectation | Low | Aggregate displayed on room cards |
| Photo attachment on review | Korean campers heavily rely on user photos (인증샷 culture) | Medium | Image upload + CDN storage |
| Admin reply to review (답변) | Shows operator responsiveness; standard on Korean hospitality sites | Low | Single reply per review, displayed below |
| Review gating (숙박 인증) | Reviews restricted to verified guests only; prevents fake reviews | Low | Check against completed reservations |

### Admin Panel

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reservation list with status (예약/취소/완료) | Core admin function; filter by date, status, room type | Medium | Table with search/filter/sort |
| Manual reservation cancellation | Operator sometimes needs to cancel (site damage, weather) | Low | Status update + trigger refund + send AlimTalk |
| Room management (CRUD + photos + pricing matrix) | Operator needs to manage inventory without developer | Medium | Rich form with 4-tier price inputs per room type |
| Add-on management (CRUD + active toggle) | Add seasonal items (e.g., snowshoe rental in winter) | Low | Simple CRUD with active flag |
| Dashboard: today's check-in/check-out, occupancy | Operator morning briefing view | Medium | Derived from reservation data; no external data needed |
| Revenue summary (기간별 매출) | Operator needs daily/monthly reporting | Medium | Aggregation queries; export to CSV is bonus |
| Customer list + reservation history | CRM basics; repeat customer recognition | Low-Medium | Read-only view of customer records |
| AlimTalk send log | Operator needs to verify notifications were sent | Low | Simple log table: message type, recipient, timestamp, status |

### Site Information Pages

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Location/map page (위치안내) | Essential for camping; Kakao Map or Naver Map embed is standard in Korea | Low | Static page with embedded map (Kakao Map API preferred in Korean context) |
| Facility introduction page (시설안내) | Users evaluate before booking | Low | Static/CMS content |
| Nearby attractions (주변관광지) | Common on Korean pension/glamping sites; helps justify booking | Low | Static content |
| Operating rules / check-in time (이용규정) | Legal and operational; Korean accommodation law requires disclosure | Low | Static page |

---

## Differentiators

Features that set this site apart from competitors. Not universally expected, but high value when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time availability heatmap calendar | Color-coded availability (여유/마감임박/마감) at a glance vs simple blocked dates | Medium | Computed from remaining inventory per date; orange = 1-2 slots left, red = full |
| Shareable booking link / QR code | Family/couple trip planning; one person shares booking confirmation QR for group entry | Low | UUID-based confirmation URL |
| Photo-rich room detail page with 360 view or video | Glamping sites convert better with immersive media; differentiates from bare-listing competitors | Medium | YouTube embed or image carousel; 360 requires third-party widget |
| Dynamic cancellation fee calculator | Show exactly how much refund the user gets based on today's date vs check-in date, per policy | Low-Medium | Policy table × days until check-in = computed refund % |
| Bulk/group booking request form | Families or corporate retreats often book 2+ sites simultaneously | Medium | Multi-room booking OR inquiry form route |
| Loyalty/repeat-visitor recognition | Returning customers feel recognized; "3번째 방문이시네요!" message | Low | Query reservation history by phone number |
| Admin mobile-responsive panel | Operator manages reservations on-the-go via phone | Medium | Responsive admin UI; not a native app |
| Revenue export to Excel/CSV | Operators use this for tax filing (부가세 신고) | Low | Stream query results as XLSX |
| Blackout dates / site maintenance mode | Operator can block dates (공사, 이벤트 등) without deleting rooms | Low | Date range block per room or site-wide |
| Waitlist / inquiry for fully booked dates | Capture demand even when full; notify on cancellation | Medium | Requires notification trigger on cancellation |
| Multi-language support (EN/ZH basic) | Foreign visitors to Korean glamping sites are a growing segment | High | i18n infrastructure cost is significant; defer unless market data supports |

---

## Anti-Features

Features to deliberately NOT build in v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multi-property / platform mode | PROJECT.md explicitly out of scope; adds tenant isolation complexity, multi-admin roles, revenue splits | Hard-coded single campsite; no tenant abstraction |
| Native mobile app (iOS/Android) | PROJECT.md out of scope; doubles development surface area for no demonstrated need yet | Responsive web with PWA-friendliness (viewport meta, touch targets) |
| Naver Smart Order / OTA channel sync | Complex inventory sync with external platforms; race conditions on availability | Self-contained reservation system only; OTA sync is v2+ |
| Real-time chat / live support | Significant infrastructure (WebSocket, operator availability); low ROI for single operator | Kakao Channel link (플친 추가) button for async messaging |
| Points / mileage loyalty system | Full loyalty programs require accounting, expiry logic, and marketing strategy before launch | Simple visit count display is sufficient differentiator |
| Dynamic pricing / yield management | Revenue management algorithms require occupancy data history; premature optimization | Manual 4-tier seasonal pricing covers the use case |
| AI-powered recommendation engine | No training data at launch; premature | Filter/sort by date and room type is sufficient |
| Multi-currency / international PG | Korean market only per project constraints | KRW only; single PG (PortOne recommended) |
| Guest user reviews without booking verification | Opens spam/fake review risk immediately | Review gating: only verified guests (completed reservation) can write |
| Inventory forecasting / revenue analytics dashboards | Complex BI tooling; single operator does not need Tableau-level analytics | Simple daily/monthly revenue table + export |

---

## Feature Dependencies

```
Date classification engine (4-tier)
  → Room pricing display
    → Booking summary
      → Payment
        → Reservation record
          → Admin reservation list
          → AlimTalk booking confirmation
          → Review unlock (post-stay)
            → Admin review reply

Room CRUD (admin)
  → Room browsing (customer)
    → Availability calendar
      → Date-picker with blocking

Add-on CRUD (admin)
  → Add-on selection (customer, booking step 2)
    → Add-on line items on reservation
      → Booking summary subtotal

PG integration (PortOne / 토스페이먼츠)
  → Kakao Pay
  → Toss Pay
  → Credit card
  → Refund on cancellation

Kakao AlimTalk channel approval (external dependency)
  → Booking confirmation AlimTalk
  → Check-in reminder AlimTalk
  → Cancellation AlimTalk

User identity (phone number, not email-only)
  → AlimTalk delivery
  → Booking verification for reviews
  → Repeat-visitor recognition
```

---

## MVP Recommendation

Prioritize for launch (v1):

1. **Availability calendar + room browsing** — first thing a user does; blocks everything else
2. **4-tier seasonal pricing engine** — Korean market non-negotiable; must be correct before any booking
3. **Booking flow with add-on cart** — core value proposition per PROJECT.md
4. **Payment via PortOne (Kakao Pay + Toss Pay + card)** — without real payment, site is just a contact form
5. **Kakao AlimTalk: booking confirmation + D-1 reminder** — trust and operational necessity
6. **Admin: reservation management + room/add-on CRUD** — operator cannot run the site without this
7. **Admin dashboard (today's check-in/check-out + revenue)** — operator morning workflow
8. **Review system (post-stay, photo, admin reply)** — social proof accelerates future bookings
9. **Site info pages (location, facility, rules)** — legal and operational requirement

Defer to v2:
- **Waitlist on fully booked dates** — valuable but not blocking launch
- **Bulk/group booking** — handle via phone until demand is proven
- **Revenue export to Excel** — manual workaround exists at launch scale
- **Multi-language (EN/ZH)** — validate Korean demand first

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| 4-tier seasonal pricing as Korean standard | HIGH | Widely documented in Korean camping market; confirmed by PROJECT.md context |
| Kakao AlimTalk as primary notification channel | HIGH | Korean market de facto standard; officially supported by Kakao for Business |
| PortOne (구 아임포트) as PG integration layer | HIGH | Dominant Korean PG aggregator; supports Kakao Pay, Toss Pay, all major card issuers |
| Review gating on verified stays | HIGH | Standard Korean accommodation UX pattern |
| Add-on cart pattern during booking | MEDIUM | Common in Korean pension/glamping sites; WebFetch unavailable to verify exact UX patterns |
| Feature set of competitor platforms (글램픽 등) | MEDIUM | Based on training data (pre-Aug 2025); could not verify current feature set via web |
| Differentiator impact (heatmap calendar, etc.) | LOW | Competitive advantage claims require live market validation |

---

## Sources

- PROJECT.md: D:/개발/camping/.planning/PROJECT.md (primary requirements source)
- Korean camping market knowledge (training data, cutoff August 2025): Glampick, AutoCamping, Naver Camping category conventions
- Kakao AlimTalk API: https://developers.kakao.com/docs/latest/ko/message/common (could not verify via WebFetch; based on training knowledge)
- PortOne (아임포트) PG: https://portone.io (could not verify via WebFetch; based on training knowledge)
- Korean Consumer Protection Act refund policy requirements: 공정거래위원회 소비자분쟁해결기준 (training knowledge)
- NOTE: WebSearch and WebFetch were unavailable during this research session. All findings carry MEDIUM confidence unless corroborated by PROJECT.md. Phase-specific research should verify competitor features and PG API current status before implementation.
