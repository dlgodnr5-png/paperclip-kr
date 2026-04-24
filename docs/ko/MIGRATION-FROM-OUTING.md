# "외출 모드" → Paperclip 자동 감독 이행 가이드

> 기존 무기고(`program-main/CLAUDE.md`) "외출 모드" 프로토콜 사용자를 위한 전환 가이드.

---

## TL;DR

| 항목 | 기존 (수동) | 신규 (D4 이후) |
|------|-----------|---------------|
| 트리거 | 사용자가 "외출" 이라고 입력 | 동일 (그리고 `python -m tools.paperclip_bridge outing start`) |
| 중간 보고 | 없음 (침묵) | **Paperclip 이벤트 실시간 중계** (budget/approval/goal) |
| 완료 보고 | `send_tagged("완료...")` 수동 1회 | 동일 + 자동 이벤트 |
| 개입 기준 | 돌이킬 수 없는 삭제, 공개 배포, 비용 | 동일 + Paperclip approval.requested 자동 |
| Telegram 봇 | notifier (모든 메시지) | **긴급 = pc_commander, 일반 = notifier** 분리 |

**핵심 변경**: 외출 중 Paperclip 이 **실시간 이벤트를 WebSocket 으로** 흘려주고, 그중 관심사(budget/approval/goal)만 Telegram 으로 중계.

---

## 뭐가 달라졌나

### 1. 자동 중계 추가됨 (기존엔 없었음)
과거엔 "완료 시 한 번" 보고했지만, 이제 다음 이벤트를 **실시간** 중계:

| 분류 | 봇 | 예시 action |
|------|-----|-------------|
| 🚨 긴급 | `pc_commander` | `budget_hard_stopped`, `budget_soft_threshold_crossed`, `approval_requested`, `security*` |
| ℹ️ 일반 | `notifier` (기본) | `approval_approved`, `goal.completed`, `agent.hired`, `run.finished`, `company.created` |

우선순위가 `pc_commander` 로 가면 소리 크게 울리고 박사님이 바로 확인 가능.

### 2. 시작/종료가 명시적
기존: "외출" 이라는 말만 하면 끝 (에이전트 내부 상태).
신규: 그 위에 `outing start/stop` 추가.

```bash
cd "d:/Naver MYBOX/06 main/program-main"
python -m tools.paperclip_bridge outing start   # listener 백그라운드 실행
# ... 외출 동안 Telegram 이벤트 수신 ...
python -m tools.paperclip_bridge outing stop    # listener 종료
```

### 3. 에이전트 자율성 원칙은 그대로
변한 게 없는 부분:
- 에이전트팀 최대 활용 (Explore / Plan / code-orchestrator 등)
- 독립 판단 가능한 건 묻지 않고 실행
- 개입 기준 4종 (삭제, 배포, 비용, 불명확 기획)

---

## 이행 단계

### 이미 외출 모드 쓰고 있던 사용자

1. **Paperclip dev 서버 기동** (아직 안 했으면):
   ```bash
   cd C:/dev/paperclip-kr
   NODE_OPTIONS="--max-old-space-size=8192" npx --yes pnpm dev
   ```
2. **회사/agent 1개 이상 존재 확인**:
   ```bash
   curl -s http://127.0.0.1:3100/api/companies
   ```
   비어 있으면 [GETTING-STARTED.md](./GETTING-STARTED.md) §2 참고하여 1개 생성.
3. **외출 선언 시** 기존 "외출" 발화 + 아래 1줄:
   ```bash
   python -m tools.paperclip_bridge outing start
   ```
4. **귀가 시**:
   ```bash
   python -m tools.paperclip_bridge outing stop
   ```

### Paperclip 없이 레거시 모드만 쓰고 싶으면
기존 방식 여전히 작동. `outing start` 만 생략. 단 실시간 중계는 없음 (완료 보고만).

---

## 주의 사항

### Paperclip 꺼져 있을 때 `outing start`
- 첫 연결 실패 → exit 2 + "no active company" 에러
- dev 서버부터 띄워야 함

### Paperclip 중간에 꺼지면
- listener 는 **60초 지수 백오프로 계속 재연결 시도** (crash 안 남)
- dev 서버가 다시 뜨면 자동으로 스트림 재개
- 그 사이 발생한 이벤트는 UI 브로드캐스트라 **휘발** (복구 불가) — 나중에 Paperclip 에서 히스토리는 볼 수 있음

### PC 사령관 봇 죽어 있으면
- urgent 분류 메시지가 발송되었다고 Paperclip 로그엔 남지만 Telegram 수신 실패
- 자동 복구: 30분마다 watchdog 이 `python -m tools.paperclip_bridge ensure-bot` 실행
- 수동:
  ```bash
  python -m tools.paperclip_bridge ensure-bot
  ```

---

## 레거시 외출 모드 Deprecation 일정

- **지금**: 두 모드 공존 (이행 기간)
- **2주 후**: 무기고 `CLAUDE.md` 의 기존 외출 섹션에 **"(레거시)"** 표기
- **추후**: 한글 사용자 가이드 기본 경로를 Paperclip 자동 감독으로 단일화

---

## 파일 참조

- Listener: `program-main/tools/paperclip_bridge/event_listener.py`
- Telegram 중계 핸들러: `.../telegram_bridge.py` (action 분류 + 포맷)
- 외출 CLI: `.../outing.py`
- Paperclip 측 이벤트 원천: `C:/dev/paperclip-kr/server/src/services/live-events.ts` (WS 브로드캐스트)
- 무기고 `CLAUDE.md` 외출 모드 섹션: Paperclip 자동 감독 블록
