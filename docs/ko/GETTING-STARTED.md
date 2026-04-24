# 시작하기 (GETTING-STARTED)

> `paperclip-kr` 한글 포크 사용자용 10분 부팅 가이드.
> 원본 Paperclip 문서: [AGENTS.md](../../AGENTS.md) · 한글 요약: [AGENTS.md](./AGENTS.md)

---

## 준비물

- **Node.js 22+** (pnpm 권장, `npx --yes pnpm` 으로도 가능)
- **Python 3.11+** (무기고 bridge 도구 사용 시)
- **Windows/macOS/Linux** — 모든 OS 지원. 본 가이드는 Windows 기준.
- **RAM 8GB 이상** — dev 서버는 `NODE_OPTIONS="--max-old-space-size=8192"` 권장
- **디스크**: **로컬 SSD 필수** — NAS/클라우드 동기화 폴더(Naver MYBOX, Dropbox 등)에서 pnpm/vite 빌드 금지 (hang 또는 OOM 발생)

---

## 1. 저장소 준비 (5분)

### 1-1. clone
```bash
# 로컬 디스크에 clone (NTFS 클라우드 동기화 폴더 금지)
mkdir -p C:/dev
cd C:/dev
git clone https://github.com/dlgodnr5-png/paperclip-kr.git
cd paperclip-kr
git remote add upstream https://github.com/paperclipai/paperclip.git
git checkout ko   # 한글 작업 브랜치
```

### 1-2. 의존성 설치
```bash
NODE_OPTIONS="--max-old-space-size=8192" npx --yes pnpm install
# 첫 설치 ~40초 소요
```

### 1-3. dev 서버 부팅
```bash
NODE_OPTIONS="--max-old-space-size=8192" npx --yes pnpm dev
```

검증:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/api/health
# → 200
```

브라우저에서 `http://127.0.0.1:3100/` → 한글/영문 토글 확인.

---

## 2. 회사 + 첫 사령관(agent) 만들기 (2분)

### 2-1. 회사 생성
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"내 회사","description":"테스트","budgetMonthlyCents":2500}' \
  http://127.0.0.1:3100/api/companies
# → {"id":"<company-uuid>", ...}
```
반환된 `id` 를 기록.

### 2-2. 승인 게이트 일시 해제 (dev 한정)
```bash
curl -s -X PATCH -H "Content-Type: application/json" \
  -d '{"requireBoardApprovalForNewAgents":false}' \
  http://127.0.0.1:3100/api/companies/<company-uuid>
```

### 2-3. Claude Opus 사령관 고용
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"claude-opus","adapterType":"claude_local","adapterConfig":{"model":"claude-opus-4-7"},"budgetMonthlyCents":1500}' \
  http://127.0.0.1:3100/api/companies/<company-uuid>/agents
```

---

## 3. 무기고(arsenal) 스킬 동기화 (2분)

`program-main` 무기고의 스킬 200+를 Paperclip agent 에 노출.

```bash
cd "d:/Naver MYBOX/06 main/program-main"

# 1회성 수동 sync (core bundle ~96개)
python -m tools.paperclip_bridge build --bundle core --sync

# 결과: agent.adapterConfig.paperclipRuntimeSkills 에 96개 주입
#   (번들 Paperclip 4개 + 무기고 S/A 등급 92개)
```

`update_monitor` 가 30분마다 자동 sync 하므로 이후엔 수동 불필요.

### 확인
```bash
curl -s http://127.0.0.1:3100/api/companies/<company-uuid>/agents \
  | python -c "import json,sys; d=json.load(sys.stdin); print(len(d[0]['adapterConfig']['paperclipRuntimeSkills']))"
# → 96
```

---

## 4. 외출 모드 (실시간 Telegram 감독)

박사님이 자리 비울 때 Paperclip 이벤트(예산 초과, 승인 요청, 목표 완료)를 Telegram 으로 자동 중계.

### 4-1. 시작
```bash
cd "d:/Naver MYBOX/06 main/program-main"
python -m tools.paperclip_bridge outing start
# → 🚶 외출 모드 시작 알림 발송
#   WebSocket listener 백그라운드 실행
```

### 4-2. 귀가
```bash
python -m tools.paperclip_bridge outing stop
# → 🏠 외출 모드 종료 알림
```

### 4-3. 상태 확인
```bash
python -m tools.paperclip_bridge outing status
```

분류:
| 이벤트 | 봇 | 예시 |
|--------|-----|------|
| 🚨 긴급 | pc_commander | `budget_hard_stopped`, `approval_requested`, `security*` |
| ℹ️ 일반 | notifier | `approval_approved`, `goal.completed`, `agent.hired` |

---

## 5. 승계 체인 (장애 자동 대응)

Claude / OpenAI / Google API 장애 시 자동으로 다음 순위 사령관으로 교체.

### 5-1. 체인 확인
```bash
python -m tools.paperclip_bridge succession chain
```
```
1위 Claude Opus 4.7    claude_local:claude-opus-4-7
2위 Claude Sonnet 4.6  claude_local:claude-sonnet-4-6
3위 Claude Haiku 4.5   claude_local:claude-haiku-4-5-20251001
4위 Codex CLI GPT-5    codex_local:gpt-5
5위 Gemini 2.5 Pro     gemini_local:gemini-2.5-pro
6위 Ollama Qwen3       (수동 처리)
```

### 5-2. 수동 교체
```bash
python -m tools.paperclip_bridge succession plan <agent-id>       # 다음 추천
python -m tools.paperclip_bridge succession promote <agent-id> --rank 2
python -m tools.paperclip_bridge succession promote <agent-id> --rank 2 --dry-run
```

### 5-3. 자동 감지
```bash
# API provider 상태 체크
python -m tools.paperclip_bridge health
# → anthropic ok / openai ok / google ok
#   available ranks: [1, 2, 3, 4, 5]

# 장애 시 전 agent 자동 강등 (30분 cron 이 알아서 실행, 수동은:)
python -m tools.paperclip_bridge auto-demote --dry-run
python -m tools.paperclip_bridge auto-demote
```

---

## 6. 장애 복구 도구

### 6-1. Telegram 재전송 큐
Telegram 발송 실패 시 자동 큐잉 → 30분 cron 이 재전송.
```bash
python -m tools.paperclip_bridge queue size
python -m tools.paperclip_bridge queue flush   # 수동 재전송 시도
```

### 6-2. PC 사령관 봇 watchdog
`@natas01bot` polling 프로세스가 죽어있으면 자동 재기동.
```bash
python -m tools.paperclip_bridge ensure-bot
```

### 6-3. COMMAND-JOURNAL 인수
세션이 강제 종료되면 차순위 사령관이 저널만 읽고 재개.
```bash
python tools/succession_boot.py --rank 2 --notify
```

---

## 자주 만나는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| `pnpm dev` 즉시 OOM | NTFS 클라우드 폴더 | clone 을 로컬 SSD (`C:/dev/`) 로 이동 |
| `tsx not found` | pnpm workspace 인식 실패 | 같은 원인 — 로컬 SSD 사용 |
| `Command "tsx" not found` 반복 | 이전 dev-watch lock | `Get-NetTCPConnection -LocalPort 3100` + `Stop-Process` |
| Postgres `lock file already exists` | postmaster.pid 잔해 | `Remove-Item ~/.paperclip/instances/default/db/postmaster.pid -Force` |
| @natas01bot 응답 없음 | polling 봇 다운 | `python -m tools.paperclip_bridge ensure-bot` |

---

## 다음 단계

- **지휘권 연속성 (CoC)**: [CONTINUITY-OF-COMMAND.md](./CONTINUITY-OF-COMMAND.md)
- **기존 "외출 모드" 사용자**: [MIGRATION-FROM-OUTING.md](./MIGRATION-FROM-OUTING.md)
- **UI 한글화 기여**: [I18N-USAGE.md](./I18N-USAGE.md)
- **전체 로드맵**: [KOREANIZATION-PLAN.md](./KOREANIZATION-PLAN.md)

---

## 📞 연락 / 보안

- 보안 이벤트 감지 시 자동 FREEZE → `pc_commander` 봇으로 🚨 알림 → 박사님 응답 `1`(해제) / `2`(차단유지) 대기
- 응답 없으면 **무기한 대기** (자동 해제 금지)
- 상세: 무기고 `CLAUDE.md` 0순위 Zero-Trust Security Gate 섹션
