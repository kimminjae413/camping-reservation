---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-06T12:56:11.013Z"
progress:
  total_phases: 10
  completed_phases: 0
  total_plans: 5
  completed_plans: 1
  percent: 20
---

# Project State: CampingSite

**Last updated:** 2026-04-06
**Session:** Phase 01 Plan 01 execution

---

## Project Reference

**Core Value:** 고객이 원하는 날짜에 객실을 선택하고, 필요한 부대시설을 추가하여, 결제까지 한 번에 완료할 수 있어야 한다.

**Current Focus:** Phase 01 — Foundation

---

## Current Position

| Field | Value |
|-------|-------|
| Milestone | v1 |
| Current Phase | 01 — Foundation |
| Current Plan | 2 of 5 |
| Status | Executing — awaiting Neon credentials for db push |

**Progress:**

```
[██░░░░░░░░] 20%
Phase: 01 (Foundation) — EXECUTING
Plan: 2 of 5
         1  2  3  4  5  6  7  8  9  10
        20% complete
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 10 |
| Phases complete | 0 |
| Plans complete | 1 |
| Requirements mapped | 43/43 |

| Phase | Duration (s) | Tasks | Files |
|-------|-------------|-------|-------|
| Phase 01-foundation P01 | 3489 | 2 tasks | 23 files |

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Phase |
|----------|-----------|-------|
| No customer accounts | Booking lookup via reservation number + phone only; simplifies auth significantly | Phase 1 |
| Price snapshot on reservation row | Admin price changes must not affect confirmed bookings; snapshot at creation | Phase 1 |
| DATE type for check-in/check-out | Check-in/out are local-date concepts (KST), not UTC moments | Phase 1 |
| PostgreSQL exclusion constraint | Database-level double-booking prevention is non-negotiable | Phase 3 |
| PENDING_PAYMENT hold TTL = 10 min | Prevents concurrent booking without permanent lock | Phase 3 |
| Toss Payments webhook server-to-server | Client callback cannot be trusted; amount must be verified server-side | Phase 6 |
| Phone encrypted at rest | Korean PIPA (개인정보보호법) requirement | Phase 1 |

### External Actions Required (Start Immediately)

These are not code tasks — they have multi-week lead times and must be started before their phases begin.

| Action | Deadline | Blocks |
|--------|----------|--------|
| Apply for Toss Payments production merchant account | Start now (2-4 week approval) | Phase 6 go-live |
| Register KakaoTalk Business channel | Start now (additional days) | v2 AlimTalk |
| Submit Kakao AlimTalk templates to Solapi for approval | Start during Phase 1 (2-5 business days) | v2 Notifications |

### Architecture Notes

- **Stack:** Next.js 15 App Router monolith, PostgreSQL 16 (Neon), Prisma 5, Tailwind CSS v4, shadcn/ui
- **Auth:** Auth.js v5 (verify stability at authjs.dev; fallback to NextAuth v4 if still beta)
- **Images:** Cloudflare R2 (zero egress fees for campsite gallery)
- **Deployment:** Vercel with Seoul PoP
- **Notifications:** Solapi SDK for Kakao AlimTalk (v2, deferred from v1)
- **Pattern:** Monolith with enforced service layer (BookingService, PricingEngine, AvailabilityService, PaymentService)

### Verify Before Implementation

| Item | Where to verify |
|------|----------------|
| Auth.js v5 stable status | https://authjs.dev |
| Toss Payments npm package name + SDK version | https://docs.tosspayments.com |
| Solapi SDK current version + pricing | https://docs.solapi.com |
| Neon + Prisma 5 connection pooler (`DIRECT_URL` requirement) | https://neon.tech/docs |

### Open Decisions

| Decision | Options | Needed By |
|----------|---------|-----------|
| Kakao Map vs Naver Map for directions page | Korean camping audience trends toward Naver for navigation | Phase 10 |
| Virtual account (가상계좌) payment support | Adds async webhook complexity; excludes may lose older demographics | Phase 6 |
| Partial cancel scope | Remove add-on triggers PG partial cancel vs booking credit — materially different complexity | Phase 6 |

### Todos

- [ ] Verify Auth.js v5 stability before Phase 1 begins
- [ ] Start Toss Payments production merchant registration immediately
- [ ] Decide Kakao Map vs Naver Map before Phase 10 planning
- [ ] Decide virtual account support scope before Phase 6 planning
- [ ] Decide partial cancel implementation approach before Phase 6 planning

### Blockers

| Blocker | Blocks | Resolution |
|---------|--------|-----------|
| Real Neon DATABASE_URL + DIRECT_URL needed in .env | Task 2 db push (01-01), all subsequent plans using Prisma | Set credentials from console.neon.tech then run `npx prisma db push` |

---

## Session Continuity

**To resume work:** Run `/gsd-execute-phase 01-foundation` to continue with Plan 02.

**Stopped at:** Completed 01-01-PLAN.md — awaiting Neon credentials for db push (BLOCKING)

**Context for next session:**

- Plan 01-01 complete: Next.js 16 + Prisma 6 schema + R2 client + Zod validations + shadcn/ui installed
- BLOCKING: `prisma db push` requires real Neon credentials in `.env` (DATABASE_URL + DIRECT_URL)
- After db push: run `npx prisma db execute --stdin` to enable btree_gist extension
- Plan 01-02 next: admin authentication (JWT cookies via jose, env-based credentials)
- Stack confirmed: Next.js 16.2.2, Prisma 6.19.3, custom JWT (jose 6.2.2) — no Auth.js needed
- Research flags: Phase 3 has sharp implementation edges (PostgreSQL range exclusion constraint, PENDING_PAYMENT TTL expiry)

---

*State initialized: 2026-04-06*
