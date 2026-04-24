# 한글화 로드맵 (KOREANIZATION-PLAN)

> `paperclip-kr`의 한글화 + 박사님 무기고 통합 로드맵
> **상위 플랜**: `C:\Users\이해욱\.claude\plans\lively-waddling-teapot.md`
> **현재 단계**: D1 (포크 + 초벌 번역) — 완료 진행 중
> **최종 목표**: D6 e2e 검증 + v0.1.0-ko 릴리스

---

## 📊 진행 현황 (2026-04-24, D6 진입)

| 단계 | 상태 | 내용 |
|------|------|------|
| D0 | ✅ 완료 | (`program-main`) CoC + Security Gate 기반 |
| D1 | ✅ 완료 | Fork + clone + 초벌 번역 (README.ko, AGENTS.ko, KOREANIZATION-PLAN) |
| D2 | ✅ 완료 | i18next 인프라 + locale + LanguageToggle ([`I18N-USAGE.md`](I18N-USAGE.md)) |
| D2.5 | ✅ 완료 | NTFS 이슈 → `C:/dev/paperclip-kr/` 로 clone 이동 |
| D3 | ✅ 완료 | **원안 폐기** — 어댑터 신설 대신 `program-main/tools/paperclip_bridge/` 외부 sync. `agent.adapterConfig.paperclipRuntimeSkills` 에 무기고 스킬 주입. **paperclip-kr 본체 수정 zero** |
| D3.5 | ✅ 완료 | 이중 리뷰 (Explore+Plan) → C1/C2/M1~M6/DRIFT-3 10건 수정. 96 entries (번들 4 + 무기고 92), 백슬래시 0, 이식성 OK |
| D4 | ✅ 완료 | Paperclip 에 outgoing webhook 없음 → WebSocket `/api/companies/<id>/events/ws` 구독으로 교체. event_listener + telegram_bridge + outing 모듈 |
| D4.6 | ✅ 완료 | PC 사령관 봇 복구 + watchdog 구축 (`pc_bot_alive.py`) |
| D5 | ✅ 완료 | 승계 체인 1~5위 Python (`succession.py`) — adapterType + model PATCH 전환 |
| D5.5 | ✅ 완료 | 자동화 3종 — `health.py` + `auto_demote.py` + `telegram_queue.py`. update_monitor 30분 cron 4-hook 통합 |
| **D6** | 🔄 **진행 중** | docs/ko 3종 (이 문서, `GETTING-STARTED`, `CONTINUITY-OF-COMMAND`, `MIGRATION-FROM-OUTING`) + `v0.1.0-ko` 릴리스 |

**보류 (별도 트랙)**:
- D6 실 e2e 장애 시뮬 — paperclip dev 재기동 불안정 (node/pnpm 잔해 누적). 깨끗한 세션에서 별도.
- 6위 Ollama — Paperclip adapter 부재, `process` 어댑터 래퍼 방식 별도 설계.
- API provider 장애 자동 복귀 — 비용 증가 가능성으로 박사님 승인 방식 유지.

---

## 🗂️ 번역 우선순위

### P0 — 즉시 사용자 접촉 (UI 렌더 / CLI 출력)
**D2 우선 대상**
- `ui/**/*.tsx` 내 하드코딩 문자열 — i18next `t()` 래핑
- `packages/cli/src/**` CLI 프롬프트/에러 메시지
- 로그인/온보딩 화면 우선

### P1 — 문서 (개발자가 읽음)
**D1 + D6 분산**
- ✅ `README.ko.md` (요약) — D1
- ✅ `docs/ko/AGENTS.md` (요약) — D1
- ⏸️ `docs/ko/SPEC-implementation.md`
- ⏸️ `docs/ko/DEVELOPING.md`
- ⏸️ `docs/ko/DATABASE.md`
- ⏸️ `docs/ko/adapters/*.md`

### P2 — 코드 주석 / 에러 메시지 / 로그
**D3~D5 분산**
- 서버 내부 로그는 **영어 유지** (기술 디버그용)
- 사용자 향한 에러 메시지만 번역
- 코드 주석은 번역 안 함 (업스트림 머지 충돌 방지)

### P3 — 에이전트 프롬프트 (`.agents/*.md`, `packages/adapters/**/prompts/*`)
**D3~D4**
- AI 에이전트에게 전달되는 프롬프트
- 한글로 번역 시 성능 변동 가능 → 실사용 후 튜닝

---

## 🔧 i18next 구조 (D2 청사진)

```
ui/
  src/
    i18n/
      index.ts       # i18next init + 언어 자동 감지
      ko.json        # 한글 키-값
      en.json        # 영어 원본 (fallback)
    components/...
      → t('dashboard.title') 식으로 래핑
```

**키 네이밍 규칙**:
- `area.subarea.action` (예: `board.issue.create`)
- 동사형 액션은 명사 위에 중첩 (`budget.exceed.message`)
- 에러는 `error.<code>` 통일

**번역 파일 관리**:
- `locale/ko.json` — 한글 담당 (이 포크)
- `locale/en.json` — 업스트림 머지 대상
- 충돌 최소화 위해 키 순서는 알파벳 정렬

---

## 🤝 업스트림 동기화 전략

**주 1회 (매주 월요일)**:
```sh
git checkout master
git fetch upstream
git merge upstream/master
# 충돌 시 upstream 우선 (코드 동작 유지)
git push origin master

git checkout ko
git merge master
# 충돌 시 우리 번역 우선 (locale/ko.json)
# 충돌 파일이 문자열 추가/변경이면 → t('new.key') 래핑 + ko.json에 키 추가
git push origin ko
```

**자동화**:
- `scripts/upstream-sync.sh` (D6에서 작성)
- GitHub Actions로 매주 실행
- 충돌 있으면 PR 자동 생성해 박사님에게 알림

---

## 🛡️ 무기고 통합 포인트 (D3~D5)

### D3: `paperclip-kr/adapters/arsenal-claude-code.ts`
- 무기고 스킬 202개 메타데이터를 Paperclip 툴 카탈로그로 import
- `MODEL-PRICING.md` 가격을 Paperclip `budget_limits`로 자동 주입
- S/A/B/C/D 등급 → Paperclip 도구 분류 매핑

### D4: `paperclip-kr/adapters/security-hook.ts` + `tools/telegram_sender.py` 확장
- Paperclip webhook 전부가 무기고 `security.gate.check()` 경유
- `on_goal_complete` / `on_budget_exceed` / `on_approval_required` → `send_tagged()` 자동 호출
- 외출 모드 자동화: Paperclip CLI로 "외출 프로토콜" 목표 등록

### D5: `paperclip-kr/adapters/succession-chain.ts`
- Paperclip `on_agent_down` → 무기고 승계 순위 자동 전환
- 1(Opus) → 2(Sonnet) → 3(Haiku) → 4(Codex) → 5(Gemini) → 6(Ollama)
- 전환 시 `COMMAND-JOURNAL.md` 읽고 재개 지점 자동 결정

---

## ⚠️ 리스크 & 대응

| 리스크 | 완화 |
|-------|------|
| 업스트림 변동성 (2개월 미만 공개, 1.1k open issues) | 주 1회 sync, 충돌 최소화용 키 네이밍 |
| 한글 번역 노동 과다 | P0 먼저, 기계번역 1차 + 사람 검수 |
| i18next 도입 시 리빌드 시간 증가 | 지연 로딩 + splitChunks |
| 한글 LLM 프롬프트 품질 변동 | 번역 전후 A/B 실사용 비교 |
| 무기고 경로 하드코딩 (Windows 경로) | D3에서 상대경로 or env 변수로 |

---

## ✅ 각 D 완료 조건 (Definition of Done)

**D1 (✅ 완료, 커밋 b2473805)**:
- [x] Fork 생성 (`dlgodnr5-png/paperclip-kr`)
- [x] 로컬 clone + `ko` 브랜치 + upstream 연결
- [x] `README.ko.md` 한글 요약
- [x] `docs/ko/AGENTS.md` 한글 요약
- [x] `docs/ko/KOREANIZATION-PLAN.md` (이 문서)
- [x] `AGENTS.md` 원본에 fork 섹션 안내
- [x] `README.md` 상단에 한글 README 링크
- [x] `ko` 브랜치 초기 커밋 + 푸시
- [x] 무기고 저널 + 텔레그램 알림

**D2 (✅ 인프라 완료)**:
- [x] `i18next` + `react-i18next` + `i18next-browser-languagedetector` 의존성 추가 (`ui/package.json`)
- [x] `ui/src/i18n/index.ts` 초기화 (자동 감지 + localStorage 저장)
- [x] `ui/src/i18n/locale/ko.json` + `en.json` (12 섹션, 100+ 키)
- [x] `ui/src/components/LanguageToggle.tsx` (inline + dropdown 변형)
- [x] `ui/src/main.tsx`에 `import "./i18n"` 추가
- [x] [`I18N-USAGE.md`](I18N-USAGE.md) 개발자 가이드
- [ ] `pnpm install` 실행 (사용자 작업 — NTFS 30~60s 이슈로 자동화 보류)
- [ ] 실제 UI 컴포넌트 t() wrap (D3에서 OnboardingWizard부터 점진)

**D3~D6**: 상세는 상위 플랜 참조.

---

## 📞 연락

문제 발생 시:
- 무기고 `COMMAND-JOURNAL.md`에 기록
- `tools/telegram_sender.py arsenal "..."` 로 박사님에게 보고
- 보안 이벤트면 `security/gate.py`가 자동 FREEZE + 긴급 알림
