# Phase 1: Foundation - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can log in, manage site types with photos, and configure add-on items -- all backed by a schema that is correct from day one. This phase establishes the Next.js project, database schema, admin authentication, and CRUD for sites and add-ons.

</domain>

<decisions>
## Implementation Decisions

### Admin Authentication
- **D-01:** Admin login uses environment-variable-based fixed credentials (username/password in .env), not a database user table
- **D-02:** 2-3명의 소규모 관리자가 사용. 각 관리자별 env 변수로 관리 (ADMIN_1_USER, ADMIN_1_PASS 등)
- **D-03:** Session management via httpOnly cookie with JWT. Unauthenticated requests to /admin/* return 401
- **D-04:** No customer-facing auth in this phase (customers use reservation number + phone)

### Admin Panel UI Style
- **D-05:** Latest/modern admin panel style with camping-themed warm tones (forest green, earth brown, warm beige accents)
- **D-06:** shadcn/ui component library as the base design system
- **D-07:** Sidebar navigation layout with collapsible menu (dashboard, sites, add-ons, reservations, customers, reviews, settings)
- **D-08:** Dark/light mode not required for v1

### Site Management UI
- **D-09:** Amenities input via predefined checklist (WiFi, 에어컨, 화장실, TV, 취사시설, 전기, 온수, 바베큐장, 주차, 반려동물 등)
- **D-10:** Photo upload via drag-and-drop with drag-to-reorder functionality
- **D-11:** Site type form: name, description (rich text), category, base capacity, max capacity, photos, amenities checklist, status (active/inactive)

### Add-On Management
- **D-12:** Add-on form: name, description, photo, price, price type (건당/인당/박당), max daily quantity, category, active/inactive toggle
- **D-13:** Add-on list shows activation status with toggle switch for quick enable/disable

### Database & Infrastructure
- **D-14:** PostgreSQL hosted on Neon (serverless, Prisma-compatible)
- **D-15:** File storage on Cloudflare R2 (S3-compatible, zero egress cost)
- **D-16:** Schema includes price-snapshot columns on reservations table (designed now, used later)
- **D-17:** DATE type for check-in/check-out (not TIMESTAMP -- avoids timezone issues)
- **D-18:** Phone field encrypted at rest
- **D-19:** Range exclusion constraint scaffolding for double-booking prevention (constraint created, used in Phase 3)

### Claude's Discretion
- Exact sidebar menu icons and hover states
- Admin login page visual design
- Rich text editor choice for site description
- Cloudflare R2 bucket naming and folder structure
- Prisma schema field naming conventions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/PROJECT.md` -- Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` -- SITE-01, SITE-02, ADDON-01, ADDON-02, ADDON-04

### Research
- `.planning/research/STACK.md` -- Tech stack decisions (Next.js 15, Prisma 5, Neon, R2)
- `.planning/research/ARCHITECTURE.md` -- System architecture, data models, component boundaries
- `.planning/research/PITFALLS.md` -- Schema decisions that must be correct from day one

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None -- greenfield project

### Established Patterns
- None -- patterns will be established in this phase

### Integration Points
- Google Stitch MCP available for UI design generation (connected but currently failing -- may need reconnection)
- Neon PostgreSQL connection via Prisma 5
- Cloudflare R2 via S3-compatible SDK

</code_context>

<specifics>
## Specific Ideas

- Admin panel should feel modern like Linear/Notion but with camping warmth (nature colors, not cold gray)
- 편의시설 체크리스트는 한국 캠핑장에서 흔히 제공하는 항목 위주로 구성
- Photo upload UX should be smooth -- drag-and-drop with instant preview and reorder

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-06*
