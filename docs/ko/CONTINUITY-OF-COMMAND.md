# 지휘권 연속성 (Continuity of Command, CoC)

> Paperclip + 무기고 통합 환경에서 **사령관이 죽어도 작업이 끊기지 않게** 하는 프로토콜.

---

## 원칙

> 컴퓨터가 다운되어도, API 가 장애나도, Claude 가 할당량 초과되어도 —
> **차순위 사령관이 토큰 추가 소모 없이 즉시 이어받는다.**

3가지 축:
1. **승계 체인 (6순위)** — Claude Opus → Sonnet → Haiku → Codex → Gemini → Ollama
2. **공동 저널 (append-only)** — 매 tool call 후 `COMMAND-JOURNAL.md` 체크포인트 자동 기록
3. **자동 인수 메커니즘** — 차순위 부팅 시 저널만 읽고 재개 (컨텍스트 재입력 불필요)

---

## 1. 승계 순위표

| 순위 | 사령관 | 트리거 | 모델 식별 |
|------|--------|--------|-----------|
| **1위** | Claude Code (Opus 4.7) | 기본 (예산 허용) | `claude_local` / `claude-opus-4-7` |
| **2위** | Claude Code (Sonnet 4.6) | Opus 초과 / FIT-FIRST | `claude_local` / `claude-sonnet-4-6` |
| **3위** | Claude Code (Haiku 4.5) | Sonnet 다운 / 긴급 경량 | `claude_local` / `claude-haiku-4-5-20251001` |
| **4위** | Codex CLI (GPT-5) | Claude 전체 다운 | `codex_local` / `gpt-5` |
| **5위** | Gemini CLI (2.5 Pro) | Anthropic+OpenAI 동시 다운 | `gemini_local` / `gemini-2.5-pro` |
| **6위 (최후)** | 로컬 Ollama Qwen3-14B | 인터넷 단절 | (Paperclip adapter 부재 — 수동) |

Paperclip agent 는 `adapterType` + `adapterConfig.model` 두 필드만 바꾸면 교체됨.
`PATCH /api/agents/<id>` 호출 한 번 (`replaceAdapterConfig` 생략 → 자동 머지).

---

## 2. COMMAND-JOURNAL — 공동 작업 기록

**위치**: `d:/Naver MYBOX/06 main/program-main/COMMAND-JOURNAL.md`

**형식**: append-only, 최신이 위.

```markdown
## [YYYY-MM-DD HH:MM:SS] · 사령관 {N}순위 · 세션 {short-id}

**작업**: 현재 목표 요약
**현재 단계**: D3 of D0~D6
**완료**:
- ✅ 완료 1
- ✅ 완료 2
**다음**:
- ⏳ 다음 할 것 ← 재개 지점
- ⏸️ 대기 중
**관련 파일**: `path/a.py`, `path/b.py`
**체크포인트**: commit hash 또는 WIP
**비용**: Opus ~$1.2
```

**기록 방법** (에이전트가 매 tool call 후 자동):
```python
from tools.journal_hook import checkpoint
checkpoint(
    commander_rank=1, session="xxx",
    task="D3 bridge 작성", phase="D3 of D0~D6",
    completed=["a", "b"], next_steps=["c", "d"],
    files=["tools/foo.py"], checkpoint_hash="abcd1234",
    cost_note="Opus ~$0.5",
)
```

**재개 시나리오**:
1. 세션이 비정상 종료 (Claude 크래시, 네트워크 끊김, API limit)
2. 사용자가 새 세션 시작 (또는 cron 이 차순위 기동)
3. 첫 동작: `python tools/succession_boot.py --rank N --notify`
4. 저널 최상단 파싱 → `⏳` 항목 출력 → Telegram 에 `🔄 N순위 사령관 인수 완료 — <재개 지점>` 발송
5. 이미 `✅` 인 항목은 재실행 금지 (git log 대조 필수)

---

## 3. 자동 승계 (API 장애 감지)

`update_monitor` 30분 cron 이 다음을 주기적으로 실행:

1. `python -m tools.paperclip_bridge health` — 3개 provider ping
2. 장애 감지 (status=down) 시 `auto_demote.run()` — 해당 provider 에 의존하는 agent 를 다음 가용 순위로 강등
3. 강등 발생 시 `pc_commander` 봇으로 🚨 Telegram 알림

**수동 실행**:
```bash
python -m tools.paperclip_bridge health
python -m tools.paperclip_bridge auto-demote --dry-run
python -m tools.paperclip_bridge auto-demote
```

**이중 장애 (예: Anthropic + OpenAI 동시 다운)**:
- `available_ranks` = {5}(Gemini)만 남음
- 기존 1~4 순위 agent 전부 → 5위 Gemini 로 강등
- 5위까지 다 다운되면 6위 Ollama 로 수동 전환 필요 (adapter 부재)

**장애 해소 시 자동 복귀는 하지 않음**: 비용 증가 가능성 있어 박사님 승인 필요. 수동 `succession promote <id> --rank 1` 로 원복.

---

## 4. 에러 내성 3층 방어

| 계층 | 수단 | 예시 |
|------|------|------|
| **L1 사전** | 타입 체크 / 스키마 검증 | `createCompanySchema` z.object / Python dataclass |
| **L2 실행 중** | try/except + 재시도 큐 | Telegram 발송 실패 → `telegram_queue.enqueue_failed` |
| **L3 사후** | 저널 체크포인트 + 자동 인수 | 세션 다운 → `succession_boot.py` 로 재개 |

구체:
- **git commit 매 단계** (작은 단위)
- **Telegram 발송 실패 시** `~/.paperclip/telegram-retry-queue.jsonl` 로 큐잉 → 다음 cron 에서 flush
- **Paperclip 서버 다운** — sync_client 가 connection refused 깔끔 핸들링 (errors 리스트로)
- **API 장애** — `auto_demote` 가 자동 다음 순위 강등

---

## 5. 보안 게이트 우선 (0순위)

CoC 보다 상위: **Zero-Trust Security Gate**.

- 해킹/외부 공격 감지 시 자율 에이전트는 **즉시 동결**
- `pc_commander` 봇으로 🚨 "승인? 1/2" 질의 → 박사님 응답 전까지 **무기한 대기**
- 응답 없으면 자동 해제 금지

상세: 무기고 `CLAUDE.md` 0순위 섹션 참조.

---

## 6. 장애 시뮬 e2e (개발자 검증)

> 완성 후 수동 실행으로 실 동작 확인. 깨끗한 세션에서 dev 서버 안정 상태일 때.

### 시나리오 A: Claude API 장애
1. `ANTHROPIC_API_KEY` 임시 무효화 (잘못된 값 주입)
2. `python -m tools.paperclip_bridge health` → `anthropic down`
3. `auto-demote` 실행 → 1~3위 agent 전부 4위 Codex 로 강등
4. Telegram `🔄 자동 사령관 강등 — N명` 수신 확인
5. `ANTHROPIC_API_KEY` 복구 → `succession promote <id> --rank 1` 로 수동 원복

### 시나리오 B: 세션 강제 종료
1. 작업 중 Claude Code 프로세스 kill
2. 새 세션 시작 → `python tools/succession_boot.py --rank 1 --notify`
3. 저널 최상단의 `⏳` 항목 출력 확인
4. Telegram `🔄 1순위 사령관 인수 완료 — <재개 지점>` 수신

### 시나리오 C: Telegram 네트워크 단절
1. 네트워크 차단 상태에서 `send_tagged()` 호출 → 실패
2. `~/.paperclip/telegram-retry-queue.jsonl` 에 append 확인
3. 네트워크 복구 → `python -m tools.paperclip_bridge queue flush` → 재전송 성공

---

## 7. 파일 참조

| 기능 | 파일 |
|------|------|
| 승계 체인 정의 + promote | `program-main/tools/paperclip_bridge/succession.py` |
| Health check | `.../health.py` |
| 자동 강등 | `.../auto_demote.py` |
| Telegram 재전송 큐 | `.../telegram_queue.py` |
| PC 사령관 봇 watchdog | `.../pc_bot_alive.py` |
| 외출 모드 listener | `.../event_listener.py`, `.../telegram_bridge.py`, `.../outing.py` |
| 저널 append | `program-main/tools/journal_hook.py` |
| 인수 부팅 | `program-main/tools/succession_boot.py` |
| 공동 저널 | `program-main/COMMAND-JOURNAL.md` |
