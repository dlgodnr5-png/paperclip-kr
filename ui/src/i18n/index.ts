/**
 * i18n setup — paperclip-kr 한글 포크 전용
 *
 * 사용처:
 *   - main.tsx 에서 `import "./i18n"` 한 번만 (사이드 이펙트로 초기화)
 *   - 컴포넌트에서 `import { useTranslation } from "react-i18next"` →
 *     `const { t } = useTranslation(); return <h1>{t("dashboard.title")}</h1>`
 *
 * 번역 파일:
 *   - ./locale/ko.json — 한글 (이 fork의 주 번역)
 *   - ./locale/en.json — 영어 (업스트림 호환 fallback)
 *
 * 언어 감지 우선순위 (i18next-browser-languagedetector 기본):
 *   1. localStorage `i18nextLng`
 *   2. navigator.language ("ko-KR" → "ko")
 *   3. fallback: "en"
 *
 * 언어 토글: components/LanguageToggle.tsx 사용 → i18n.changeLanguage("ko" | "en")
 */
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locale/en.json";
import ko from "./locale/ko.json";

export const SUPPORTED_LANGUAGES = ["ko", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // "ko-KR" → "ko"
    interpolation: {
      escapeValue: false, // React가 이미 XSS 처리
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    returnEmptyString: false,
    react: {
      useSuspense: false, // 번들된 JSON이라 sync 로드 — Suspense 불필요
    },
  });

export default i18n;
