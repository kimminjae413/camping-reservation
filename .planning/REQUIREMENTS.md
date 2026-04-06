# Requirements: CampingSite

**Defined:** 2026-04-06
**Core Value:** 고객이 원하는 날짜에 객실을 선택하고, 필요한 부대시설을 추가하여, 결제까지 한 번에 완료할 수 있어야 한다.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Booking Flow (예약 흐름)

- [ ] **BOOK-01**: 고객이 캘린더에서 체크인/체크아웃 날짜를 선택할 수 있다
- [ ] **BOOK-02**: 고객이 선택한 날짜에 가용한 객실 목록을 확인할 수 있다
- [ ] **BOOK-03**: 고객이 객실 상세정보(사진, 수용인원, 편의시설, 가격)를 확인할 수 있다
- [ ] **BOOK-04**: 고객이 인원수(성인/아동)를 입력하고 추가인원 요금이 자동 계산된다
- [ ] **BOOK-05**: 고객이 예약 시 부대시설(그릴, 장작, 화로대 등)을 장바구니처럼 선택/추가할 수 있다
- [ ] **BOOK-06**: 고객이 예약 요약(객실+부대시설+총 금액)을 확인한 뒤 예약을 확정할 수 있다
- [ ] **BOOK-07**: 고객이 예약번호와 전화번호로 예약을 조회할 수 있다
- [ ] **BOOK-08**: 고객이 취소 정책에 따라 예약을 취소할 수 있다

### Pricing (가격 체계)

- [ ] **PRICE-01**: 4단계 시즌 가격(비수기주중/비수기주말/성수기주중/성수기주말)을 지원한다
- [ ] **PRICE-02**: 관리자가 시즌 기간(성수기/비수기)과 각 요금을 설정할 수 있다
- [ ] **PRICE-03**: 주중/주말 구분이 자동 적용된다 (금/토 = 주말 요금)
- [ ] **PRICE-04**: 추가인원 요금(기준인원 초과 시)이 자동 계산된다
- [ ] **PRICE-05**: 예약 시점의 가격이 스냅샷으로 저장된다 (이후 가격 변경에 영향 없음)

### Payment (결제)

- [ ] **PAY-01**: 고객이 카드/카카오페이/토스페이로 결제할 수 있다
- [ ] **PAY-02**: 결제 완료 후 예약이 자동 확정된다 (서버 간 webhook 검증)
- [ ] **PAY-03**: 취소 시 환불 정책에 따라 자동/수동 환불이 처리된다
- [ ] **PAY-04**: 관리자가 결제 내역과 환불 이력을 확인할 수 있다

### Add-On Facilities (부대시설)

- [ ] **ADDON-01**: 관리자가 부대시설 항목(이름, 가격, 사진, 수량, 가격유형)을 등록/수정할 수 있다
- [ ] **ADDON-02**: 관리자가 부대시설 항목을 활성화/비활성화할 수 있다
- [ ] **ADDON-03**: 부대시설이 일별 재고 수량을 관리한다 (소진 시 자동 비노출)
- [ ] **ADDON-04**: 부대시설 가격유형을 지원한다 (건당/인당/박당)

### Admin - Site Management (관리자 - 객실 관리)

- [ ] **SITE-01**: 관리자가 객실 유형(글램핑, 오토캠핑, 카라반 등)을 등록/수정/삭제할 수 있다
- [ ] **SITE-02**: 관리자가 객실별 사진, 설명, 수용인원, 편의시설을 관리할 수 있다
- [ ] **SITE-03**: 관리자가 특정 날짜를 예약 불가로 차단할 수 있다 (정비/휴무)
- [ ] **SITE-04**: 관리자가 최소 숙박일수를 설정할 수 있다 (주말/성수기 2박 등)

### Admin - Reservation Management (관리자 - 예약 관리)

- [ ] **RESV-01**: 관리자가 전체 예약 목록을 필터/검색할 수 있다 (날짜, 상태, 객실, 이름)
- [ ] **RESV-02**: 관리자가 예약 상세(고객정보, 결제, 부대시설)를 확인할 수 있다
- [ ] **RESV-03**: 관리자가 예약을 수동 확인/취소할 수 있다
- [ ] **RESV-04**: 관리자가 전화/현장 접수 예약을 수동 생성할 수 있다
- [ ] **RESV-05**: 관리자가 캘린더(tape chart) 형태로 전체 예약 현황을 볼 수 있다

### Admin - Dashboard (관리자 - 대시보드)

- [ ] **DASH-01**: 오늘의 입실/퇴실 현황과 현재 입실률을 표시한다
- [ ] **DASH-02**: 일별/주별/월별 매출 요약을 표시한다
- [ ] **DASH-03**: 최근 예약/취소 알림을 표시한다

### Admin - Customer & Review (관리자 - 고객/리뷰)

- [ ] **CUST-01**: 관리자가 고객 목록과 예약 이력을 확인할 수 있다
- [ ] **REVW-01**: 고객이 이용 완료 후 리뷰(별점+텍스트)를 작성할 수 있다
- [ ] **REVW-02**: 관리자가 리뷰에 답변할 수 있다

### Public Pages (공개 페이지)

- [ ] **PAGE-01**: 캠핑장 소개 페이지(소개, 시설안내, 주변관광지)가 있다
- [ ] **PAGE-02**: 오시는 길(카카오맵/네이버맵) 페이지가 있다
- [ ] **PAGE-03**: 이용안내 및 환불규정 페이지가 있다
- [ ] **PAGE-04**: 모바일 반응형으로 모든 페이지가 동작한다

### Availability & Anti-Collision (가용성/이중예약 방지)

- [ ] **AVAIL-01**: 객실별 날짜별 가용 현황이 실시간으로 반영된다
- [ ] **AVAIL-02**: 이중예약이 데이터베이스 레벨에서 방지된다 (exclusion constraint)
- [ ] **AVAIL-03**: 결제 대기 중 임시 홀드(10분)로 다른 고객의 동시 예약을 차단한다

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: 카카오 알림톡으로 예약확인/리마인더/취소 알림 발송
- **NOTF-02**: SMS 폴백 (알림톡 미수신 시)
- **NOTF-03**: 관리자에게 신규 예약/취소 실시간 알림

### Enhanced Features

- **ENH-01**: 카카오/네이버 소셜 로그인
- **ENH-02**: 반려동물 동반 필터 및 추가요금
- **ENH-03**: 쿠폰/할인코드 시스템
- **ENH-04**: 네이버 예약 연동
- **ENH-05**: 관리자 매출 리포트 Excel 내보내기

## Out of Scope

| Feature | Reason |
|---------|--------|
| 멀티 캠핑장 플랫폼 | 단일 캠핑장 전용 사이트 |
| 모바일 네이티브 앱 | 반응형 웹으로 충분 |
| 실시간 채팅 | 전화/카카오톡 문의로 대체 |
| 포인트/적립금 시스템 | v1에서는 불필요한 복잡도 |
| OTA 채널 동기화 | 자체 예약만 운영 |
| 구독/정기결제 | 캠핑 예약에 불필요 |

## Traceability

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

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after roadmap creation — all 43 requirements mapped*
