# i18n 사용 가이드 (한글화 어떻게 적용하나)

> paperclip-kr fork의 i18next 인프라 사용법.
> D2에서 인프라만 깔았고, 실제 UI 문자열 wrap은 점진적으로 진행.

---

## 🏗️ 설치된 인프라 (D2 완료)

| 항목 | 위치 |
|------|------|
| **의존성** | `ui/package.json`: `i18next`, `react-i18next`, `i18next-browser-languagedetector` |
| **초기화** | `ui/src/i18n/index.ts` (자동 언어 감지 + localStorage 저장) |
| **번역 파일** | `ui/src/i18n/locale/ko.json` + `en.json` (12 섹션, 100+ 키) |
| **언어 토글** | `ui/src/components/LanguageToggle.tsx` |
| **부트** | `ui/src/main.tsx`에서 `import "./i18n"` |

⚠️ **첫 사용 전 의존성 설치 필요**:
```bash
cd "d:/Naver MYBOX/06 main/paperclip-kr"
pnpm install   # 또는 ui/만: pnpm --filter @paperclipai/ui install
```

---

## 🔤 컴포넌트에서 번역 사용하기

### 기본
```tsx
import { useTranslation } from "react-i18next";

export function MyComponent() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.subtitle")}</p>
      <button>{t("common.save")}</button>
    </div>
  );
}
```

### 변수 삽입 (interpolation)
번역 파일에 `{{name}}` 자리표시자:
```json
{
  "welcome": "환영합니다, {{name}}님!"
}
```
사용:
```tsx
t("welcome", { name: "박사님" })  // → "환영합니다, 박사님님!"
```

### 단/복수 처리
```json
{
  "issue_count": "{{count}}개의 이슈"
}
```
```tsx
t("issue_count", { count: 5 })  // → "5개의 이슈"
```

### 언어 토글 끼워넣기
```tsx
import { LanguageToggle } from "@/components/LanguageToggle";

<header>
  <LanguageToggle />              {/* 인라인: 두 버튼 */}
  <LanguageToggle variant="dropdown" />  {/* 드롭다운 */}
</header>
```

---

## 📚 번역 파일 키 추가하기

`ui/src/i18n/locale/ko.json`과 `en.json` **둘 다** 같은 키 구조 유지.

예: 새 페이지 "보고서" 추가
```json
// ko.json
{
  "report": {
    "title": "보고서",
    "generate": "생성",
    "download": "다운로드"
  }
}

// en.json (같은 키 구조 필수)
{
  "report": {
    "title": "Report",
    "generate": "Generate",
    "download": "Download"
  }
}
```

**키 네이밍 규칙**:
- `area.subarea.action` 식 (예: `dashboard.metrics.active_agents`)
- 알파벳 순 정렬 → 머지 충돌 최소화
- 동사형은 명사 위에 중첩 (`budget.exceed.message`)

---

## 🔄 점진 wrapping 전략 (D3~D6)

전체 UI 한 번에 wrap 금지 (충돌 폭발). 우선순위:

### P0 (D3) — 사용자 첫 진입 화면
- `OnboardingWizard.tsx` (회사 만들기)
- 메인 네비게이션 (Layout 헤더)
- 로그인/인증 화면

### P1 (D4) — 핵심 운영 화면
- 대시보드 메트릭 (`Dashboard.tsx`)
- 이슈 목록 + 상세 (`Issues.tsx`, `IssueDetail.tsx`)
- 에이전트 목록 + 상태 (`Agents.tsx`)

### P2 (D5) — 설정 & 보조
- Company Settings, User Profile, Costs
- 모달/다이얼로그 컴포넌트

### P3 (D6) — 나머지 + 검증
- 잔여 페이지 일괄 처리
- Storybook에서 ko/en 토글 테스트
- e2e: 토글 후 모든 화면 한글 렌더 확인

---

## 🛡️ 업스트림 머지 충돌 대응

업스트림(`paperclipai/paperclip`)에서 새 UI 문자열이 추가되면:

1. `git fetch upstream && git merge upstream/master` (master 브랜치)
2. `git checkout ko && git merge master` 시 충돌 발생 가능
3. **새 문자열이 t() 래핑 안 된 상태**라면:
   - 일단 영어 그대로 머지 (앱 동작 유지가 우선)
   - 별도 commit으로 t() 래핑 + ko.json 키 추가
4. **이미 ko.json에 같은 키 있는데 영어 추가**라면:
   - en.json만 영어 갱신, ko.json은 우리 번역 유지

자동화 스크립트는 D6에서 `scripts/upstream-sync.sh`로 추가 예정.

---

## 🐛 트러블슈팅

### "t is not a function"
→ `useTranslation()` 호출 안 함. `const { t } = useTranslation();` 추가.

### 번역이 키 그대로 출력 ("dashboard.title")
→ `ko.json`에 키 없음. 또는 `main.tsx`에 `import "./i18n"` 빠짐.

### 한글이 깨져 보임
→ 파일이 UTF-8 BOM 없이 저장됐는지 확인. JSON은 UTF-8 (BOM 금지).

### 언어 변경이 저장 안 됨
→ 브라우저 localStorage 권한 확인. `lookupLocalStorage: "i18nextLng"` 키 사용 중.

### 페이지 새로고침마다 영어로 돌아감
→ 브라우저 navigator.language 우선순위 → localStorage 저장 후엔 그게 우선이어야 함. `caches: ["localStorage"]` 확인.

---

## 📞 다음 단계

- D3에서 `arsenal-claude-code.ts` 어댑터 + 첫 PoC 페이지 (OnboardingWizard) 한글화
- D6에서 전체 wrap + e2e + Storybook 검증

자세한 로드맵: [`KOREANIZATION-PLAN.md`](KOREANIZATION-PLAN.md)
