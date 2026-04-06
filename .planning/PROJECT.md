# CampingSite

## What This Is

단일 캠핑장을 위한 공식 홈페이지 겸 온라인 예약 시스템. 고객이 객실을 선택하고, 부대시설(그릴, 장작 등)을 장바구니처럼 추가한 뒤 실결제까지 완료할 수 있다. 캠핑장 운영자는 풀 관리자 패널에서 예약, 객실, 부대시설, 고객, 매출을 통합 관리한다.

## Core Value

고객이 원하는 날짜에 객실을 선택하고, 필요한 부대시설을 추가하여, 결제까지 한 번에 완료할 수 있어야 한다.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] 고객이 날짜별 객실 가용 현황을 확인하고 예약할 수 있다
- [ ] 고객이 예약 시 부대시설(그릴, 장작, 화로대 등)을 옵션으로 선택/추가할 수 있다
- [ ] 고객이 토스페이/카카오페이 등으로 실결제할 수 있다
- [ ] 관리자가 객실(유형, 가격, 사진, 수용인원)을 등록/수정/삭제할 수 있다
- [ ] 관리자가 부대시설 항목을 등록/수정/활성화/비활성화할 수 있다
- [ ] 관리자가 예약을 확인/취소/관리할 수 있다
- [ ] 관리자가 대시보드에서 매출, 입실률, 오늘의 입퇴실 현황을 볼 수 있다
- [ ] 관리자가 고객 목록과 예약 이력을 관리할 수 있다
- [ ] 카카오 알림톡으로 예약 확인/리마인더를 발송할 수 있다
- [ ] 고객이 이용 후 리뷰를 작성할 수 있고, 관리자가 리뷰에 답변할 수 있다
- [ ] 4단계 시즌 가격(비수기주중/비수기주말/성수기주중/성수기주말)을 지원한다
- [ ] 캠핑장 소개 페이지(위치, 시설안내, 주변관광지 등)가 있다

### Out of Scope

- 멀티 캠핑장 플랫폼 -- 단일 캠핑장 전용 사이트
- 모바일 네이티브 앱 -- 반응형 웹으로 충분, 나중에 고려
- 네이버 예약 연동 -- v1에서는 자체 예약만
- 실시간 채팅 -- 전화/카카오톡 문의로 대체

## Context

- **디자인**: Google Stitch MCP를 활용하여 UI/UX 디자인 생성
- **한국 시장**: 한국어 기본, 카카오 알림톡 필수, 한국 PG사 결제 연동
- **시즌 가격**: 한국 캠핑 시장 표준인 4단계 시즌 가격 체계 적용
- **객실 유형**: 아직 미정이나, 글램핑(돔, 트리하우스 등) + 오토캠핑 등 유연하게 지원
- **부대시설 예시**: 그릴/바베큐, 장작/숯, 화로대, 텐트/타프, 랜턴, 테이블/의자 등
- **관리자**: 풀 관리자 패널 (예약관리, 객실관리, 부대시설관리, 대시보드, 고객관리, 알림톡, 리뷰관리)

## Constraints

- **Design Tool**: Google Stitch MCP -- UI/UX 디자인 생성에 활용
- **Market**: 한국 캠핑장 -- 한국어, 한국 결제(토스페이/카카오페이), 카카오 알림톡
- **Tech Stack**: 리서치 기반으로 최적 스택 결정 (Next.js 유력)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 단일 캠핑장 전용 | 운영자 1명이 관리하는 단일 사이트, 플랫폼 복잡도 제거 | -- Pending |
| Google Stitch로 디자인 | MCP 연동 완료, AI 기반 디자인 생성 활용 | -- Pending |
| 실결제 포함 (v1) | 예약만으로는 운영 불편, 결제까지 완결 | -- Pending |
| 부대시설 장바구니 방식 | 고객이 예약 시 자유롭게 선택 추가 | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-06 after initialization*
