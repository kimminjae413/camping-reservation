# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 01-foundation
**Areas discussed:** Admin Authentication, Admin Panel UI Style, Site/Add-On Management, Database Schema

---

## Admin Authentication

| Option | Description | Selected |
|--------|-------------|----------|
| 고정 계정 (env 변수) | .env에 아이디/비밀번호 저장. 단일 관리자라 간단하고 안전 | ✓ |
| DB 기반 관리자 계정 | DB에 관리자 테이블. 나중에 다중 관리자 확장 가능 | |
| Auth.js + Kakao OAuth | Auth.js로 카카오 로그인. 소셜 인증 기반 | |

**User's choice:** 고정 계정 (env 변수)
**Notes:** 2-3명 소규모 관리자 사용

## Admin Panel UI Style

| Option | Description | Selected |
|--------|-------------|----------|
| 사이드바 + 콘텐츠 | 왼쪽 사이드바 네비게이션 + 오른쪽 콘텐츠 (shadcn/ui 기반) | |
| 탑바 + 콘텐츠 | 상단 탭 네비게이션 + 아래 콘텐츠 (단순) | |
| 맡겨서 추천 | Claude가 적합한 스타일 결정 | ✓ |

**User's choice:** 최신 스타일로 해줘 (Other)

| Option | Description | Selected |
|--------|-------------|----------|
| 깨끗하고 미니멀 | 흰백 많고 깔끔한 느낌 (Linear, Notion 스타일) | |
| 정보 밀도 높은 | 한 화면에 많은 정보 (실무형 대시보드) | |
| 캠핑 분위기 반영 | 자연 컬러/따뜻한 톤 (캠핑 브랜드 일치) | ✓ |

**User's choice:** 캠핑 분위기 반영

## Site/Add-On Management

| Option | Description | Selected |
|--------|-------------|----------|
| 미리 정의된 체크리스트 | WiFi, 에어컨, 화장실, TV 등 리스트에서 선택 | ✓ |
| 자유 태그 입력 | 관리자가 원하는 편의시설을 자유롭게 태그로 입력 | |
| 둘 다 | 기본 체크리스트 + 사용자 정의 태그 추가 | |

**User's choice:** 미리 정의된 체크리스트

| Option | Description | Selected |
|--------|-------------|----------|
| 드래그&드롭 + 순서 변경 | 드래그로 업로드, 드래그로 순서 변경 | ✓ |
| 기본 파일 선택 | 파일 선택 버튼으로 업로드 | |
| 맡겨서 추천 | Claude가 적합한 방식 결정 | |

**User's choice:** 드래그&드롭 + 순서 변경

## Database Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Neon (Recommended) | 서버리스 PostgreSQL. Prisma와 궁합 좋고 Vercel 배포에 최적 | ✓ |
| Supabase | PostgreSQL + 인증 + 스토리지 통합 플랫폼 | |
| 맡겨서 추천 | Claude가 적합한 방식 결정 | |

**User's choice:** Neon

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare R2 | S3 호환, 전송 비용 무료. 리서치 추천 | ✓ |
| AWS S3 | 안정적이지만 전송 비용 발생 | |
| 맡겨서 추천 | Claude가 적합한 방식 결정 | |

**User's choice:** Cloudflare R2

## Claude's Discretion

- Sidebar menu icons and hover states
- Admin login page visual design
- Rich text editor choice
- R2 bucket structure
- Prisma naming conventions

## Deferred Ideas

None
