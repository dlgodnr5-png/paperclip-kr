<p align="center">
  <img src="doc/assets/header.png" alt="Paperclip — runs your business" width="720" />
</p>

<p align="center">
  <a href="#빠른-시작"><strong>빠른 시작</strong></a> &middot;
  <a href="https://paperclip.ing/docs"><strong>공식 문서 (영어)</strong></a> &middot;
  <a href="https://github.com/dlgodnr5-png/paperclip-kr"><strong>GitHub (한글 포크)</strong></a> &middot;
  <a href="docs/ko/KOREANIZATION-PLAN.md"><strong>한글화 로드맵</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://github.com/dlgodnr5-png/paperclip-kr"><img src="https://img.shields.io/badge/locale-한국어-red" alt="Korean" /></a>
  <a href="https://github.com/paperclipai/paperclip"><img src="https://img.shields.io/badge/upstream-paperclipai/paperclip-blue" alt="Upstream" /></a>
</p>

<br/>

> 🇰🇷 **한글판 알림**: 이 저장소는 [`paperclipai/paperclip`](https://github.com/paperclipai/paperclip)의 한글 포크 (`paperclip-kr`)입니다.
> 영어 원본은 [`README.md`](README.md), [`AGENTS.md`](AGENTS.md)에 그대로 보존됩니다.
> 한글화 로드맵은 [`docs/ko/KOREANIZATION-PLAN.md`](docs/ko/KOREANIZATION-PLAN.md)를 참조하세요.

<br/>

## Paperclip이란?

# 제로-휴먼 컴퍼니를 위한 오픈소스 오케스트레이션

**OpenClaw가 _직원_이라면, Paperclip은 _회사_다.**

Paperclip은 AI 에이전트 팀을 운영해 비즈니스를 굴리는 **Node.js 서버 + React UI** 입니다.
직접 만든 에이전트(BYOA)를 가져와 목표를 부여하고, 모든 작업·비용을 한 대시보드에서 관리합니다.

겉보기에는 작업 관리자(task manager) 같지만, 내부에는 **조직도, 예산, 거버넌스, 목표 정렬, 에이전트 조율** 시스템이 들어 있습니다.

**풀 리퀘스트가 아니라 비즈니스 목표를 관리합니다.**

| 단계 | 내용 | 예시 |
|------|------|------|
| **01** | 목표 정의 | _"AI 노트 앱으로 월 매출 100만 달러 달성"_ |
| **02** | 에이전트 등록 | Claude Code, Codex, Cursor를 직원으로 추가 |
| **03** | 예산 설정 | 월 한도 + 자동 중단 룰 |
| **04** | 위임 | 에이전트가 자율 실행, 사람은 승인 게이트만 |
| **05** | 추적 | 실시간 비용 + 목표 진척 대시보드 |

---

## 한글 포크의 추가 가치

이 fork(`paperclip-kr`)는 단순 번역이 아니라 **한국 박사님 무기고와의 통합 OS**를 목표로 합니다:

1. **Continuity of Command** — Claude Code 다운 시 Sonnet → Haiku → Codex → Gemini → Ollama 자동 인수
2. **Zero-Trust Security Gate** — 외부 공격 감지 시 박사님 Telegram 승인 전까지 동결
3. **공통 메모장 (COMMAND-JOURNAL.md)** — 컴퓨터 다운돼도 어디서 재개할지 자동 인수
4. **태그 알림** — 모든 에이전트 활동을 `[🛠️ 무기고 · HH:MM]` 식 태그로 Telegram 보고

자세한 통합 설계는 [`d:/Naver MYBOX/06 main/program-main/CLAUDE.md`](file:///d:/Naver%20MYBOX/06%20main/program-main/CLAUDE.md) 의 **0순위/1순위 규칙** 참조.

---

## 빠른 시작

```bash
# 1. 의존성 설치 (pnpm 사용)
pnpm install

# 2. 개발 서버 시작 (PGlite 임베디드 DB 자동 사용)
pnpm dev

# 3. 헬스체크
curl http://localhost:3100/api/health
```

서비스 주소:
- API: `http://localhost:3100`
- UI: `http://localhost:3100` (개발 모드는 API 서버에서 통합 서빙)

⚠️ 한글 포크는 **포트 3101+** 자동 감지 (업스트림 인스턴스가 3100 점유 시).

로컬 DB 초기화:
```bash
rm -rf data/pglite
pnpm dev
```

---

## 문서 (한글)

| 문서 | 내용 |
|------|------|
| [`docs/ko/AGENTS.md`](docs/ko/AGENTS.md) | 인간/AI 기여자 가이드 (한글 요약) |
| [`docs/ko/KOREANIZATION-PLAN.md`](docs/ko/KOREANIZATION-PLAN.md) | 한글화 로드맵 + 우리 무기고 통합 계획 |
| `README.md` (영어 원본) | 업스트림 README 그대로 보존 |
| `AGENTS.md` (영어 원본) | 업스트림 + paperclip-kr fork 섹션 추가 |

전체 문서 (가이드, API, 어댑터 등)는 영어 원본 `docs/`에 있으며 점진적으로 `docs/ko/`로 번역됩니다.

---

## 라이선스

MIT — 업스트림 [`paperclipai/paperclip`](https://github.com/paperclipai/paperclip) 라이선스 그대로 적용.
