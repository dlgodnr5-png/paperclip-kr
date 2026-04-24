# AGENTS.md (한글 요약)

> 원본(영어): [`../../AGENTS.md`](../../AGENTS.md)
> 이 문서는 핵심만 한글로 정리한 요약본. 세부 커밋 규칙 등은 원본을 참조.

이 저장소에서 작업하는 **인간 및 AI 기여자**를 위한 가이드.

---

## 1. 목적

Paperclip은 **AI 에이전트 컴퍼니를 위한 컨트롤 플레인**입니다.
현재 구현 목표는 V1이며 `doc/SPEC-implementation.md`에 정의돼 있습니다.

---

## 2. 변경 전 필독 순서

1. `doc/GOAL.md`
2. `doc/PRODUCT.md`
3. `doc/SPEC-implementation.md`
4. `doc/DEVELOPING.md`
5. `doc/DATABASE.md`

- `doc/SPEC.md` — 장기 제품 맥락 (긴 문서)
- `doc/SPEC-implementation.md` — V1 구현 계약 (실무)

---

## 3. 레포 맵

| 경로 | 역할 |
|------|------|
| `server/` | Express REST API + 오케스트레이션 서비스 |
| `ui/` | React + Vite 보드 UI |
| `packages/db/` | Drizzle 스키마, 마이그레이션, DB 클라이언트 |
| `packages/shared/` | 공용 타입/상수/밸리데이터/API 경로 상수 |
| `packages/adapters/` | 에이전트 어댑터 구현 (Claude, Codex, Cursor 등) |
| `packages/adapter-utils/` | 어댑터 공용 유틸 |
| `packages/plugins/` | 플러그인 시스템 |
| `doc/` | 운영/제품 문서 |

---

## 4. 개발 셋업 (자동 DB)

개발 시 `DATABASE_URL` 비워두면 임베디드 PGlite 사용.

```sh
pnpm install
pnpm dev
```

실행 주소:
- API: `http://localhost:3100`
- UI: `http://localhost:3100` (개발 중 API 서버에서 미들웨어로 서빙)

빠른 확인:
```sh
curl http://localhost:3100/api/health
curl http://localhost:3100/api/companies
```

로컬 DB 리셋:
```sh
rm -rf data/pglite
pnpm dev
```

---

## 5. 핵심 엔지니어링 규칙

1. **변경을 회사 범위로 유지**
   모든 도메인 엔티티는 회사 단위로 스코프; 회사 경계는 라우트/서비스에서 강제.

2. **계약 동기화**
   스키마/API 변경 시 영향 받는 모든 레이어 동시 업데이트:
   - `packages/db` 스키마/익스포트
   - `packages/shared` 타입/상수/밸리데이터
   - `server` 라우트/서비스
   - `ui` API 클라이언트/페이지

3. **컨트롤 플레인 불변식 보존**
   - 단일 담당자 태스크 모델
   - 원자적 이슈 체크아웃
   - 거버넌스 액션의 승인 게이트
   - 예산 하드스톱 자동 일시정지
   - 뮤테이션 액션의 활동 로그

4. **전략 문서 통째로 교체 금지** (요청 없는 한)
   추가 업데이트 선호. `doc/SPEC.md`와 `doc/SPEC-implementation.md` 정렬 유지.

5. **플랜 문서는 날짜화 + 중앙화**
   저장소 안 플랜 파일은 `doc/plans/`에 `YYYY-MM-DD-slug.md` 형식.
   Paperclip 이슈에서 플랜 요청 시에는 이슈의 `plan` 문서를 `paperclip` 스킬로 업데이트 (레포 마크다운 아님).

---

## 6. DB 변경 워크플로우

```sh
# 1. packages/db/src/schema/*.ts 수정
# 2. packages/db/src/schema/index.ts에서 export
# 3. 마이그레이션 생성
pnpm db:generate

# 4. 컴파일 검증
pnpm -r typecheck
```

주의: `drizzle.config.ts`는 컴파일된 스키마(`dist/schema/*.js`)를 읽음. `pnpm db:generate`가 `packages/db`를 먼저 빌드.

---

## 7. 핸드오프 전 검증

기본 로컬/에이전트 테스트:
```sh
pnpm test  # Vitest 스위트만, 저렴
```

브라우저 스위트는 선택:
```sh
pnpm test:e2e
pnpm test:release-smoke
```

**완료 선언 전 전체 체크**:
```sh
pnpm -r typecheck
pnpm test:run
pnpm build
```

실행 못한 게 있으면 **명시적으로 보고**할 것 (이유 포함).

---

## 8. API + 인증 기대사항

- Base path: `/api`
- 보드 접근 = 전권 운영자 컨텍스트
- 에이전트 접근 = 베어러 API 키 (`agent_api_keys`), 해싱 저장
- 에이전트 키는 **다른 회사 접근 불가**

엔드포인트 추가 시:
- 회사 접근 체크 적용
- 액터 권한 강제 (보드 vs 에이전트)
- 뮤테이션에 활동 로그 작성
- 일관된 HTTP 에러 (`400/401/403/404/409/422/500`)

---

## 9. UI 기대사항

- 라우트/네비를 API 표면과 정렬
- 회사 선택 컨텍스트를 회사 스코프 페이지에서 사용
- 실패를 명확히 드러내기 — 조용한 무시 금지

---

## 10. PR 요구사항

PR 생성 시 (`gh pr create` 또는 기타) [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md)의 **모든 섹션**을 반드시 채울 것. 즉흥 PR 본문 금지.

필수 섹션:
- **Thinking Path** — 프로젝트 맥락에서 이 변경까지의 추론 추적
- **What Changed** — 구체 변경 불릿
- **Verification** — 리뷰어가 어떻게 동작을 확인하는지
- **Risks** — 무엇이 잘못될 수 있는지
- **Model Used** — AI 모델 명시 (미사용 시 "None — human-authored")
- **Checklist** — 전 항목 체크

---

## 11. Definition of Done

다음 **모두**가 참일 때 완료:

1. 동작이 `doc/SPEC-implementation.md`에 부합
2. Typecheck, 테스트, 빌드 통과
3. 계약이 db/shared/server/ui 간 동기화
4. 행동/명령어 변경 시 문서 업데이트
5. PR 설명이 템플릿 준수 (Model Used 포함)

---

## 12. paperclip-kr 포크 전용 규칙

> 이 섹션은 **한글 포크 전용**. 업스트림 원본에는 없음.

### 브랜치 전략

| 브랜치 | 역할 |
|--------|------|
| `master` (origin) | 업스트림 미러 (주 1회 `git fetch upstream && git merge`) |
| `ko` (origin) | 한글 번역 + 무기고 통합 (주 작업 브랜치) |

업스트림 sync:
```sh
git checkout master
git fetch upstream
git merge upstream/master
git push origin master

git checkout ko
git merge master  # 충돌 시 locale/ko.json 우선
```

### 무기고 통합

우리 Claude Code 무기고(`d:/Naver MYBOX/06 main/program-main/`)와 연결:

- **보안**: 모든 tool call 전 `security.gate.check()` 통과 의무 (무기고의 `security/gate.py`)
- **저널**: 매 커밋 후 `tools.journal_hook.checkpoint()` 호출 (무기고의 `COMMAND-JOURNAL.md`)
- **알림**: Paperclip webhook → 무기고의 `tools/telegram_sender.py` 경유
- **승계**: Paperclip `on_agent_down` → 무기고 Continuity of Command 순위 자동 전환

자세한 통합 설계는 무기고 `CLAUDE.md`의 **0순위 Zero-Trust Security Gate** + **1순위 Continuity of Command** 참조.

### 포트

- **3101+**: paperclip-kr 기본 (업스트림 3100과 병행 가능)

### 한글화 진행 상황

현재(D1 단계): README 요약, AGENTS 요약만 완료.
전체 UI/CLI 한글화는 D2(i18next) 단계에서 진행.
자세한 로드맵은 [`KOREANIZATION-PLAN.md`](KOREANIZATION-PLAN.md) 참조.
