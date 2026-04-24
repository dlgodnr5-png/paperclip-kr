/**
 * LanguageToggle — 언어 전환 토글 (ko ↔ en)
 *
 * paperclip-kr 한글 포크 전용 컴포넌트.
 * TopBar / Settings / Onboarding 어디든 끼워 넣을 수 있는 가벼운 토글.
 *
 * 사용:
 *   <LanguageToggle />                      // 기본 (인라인)
 *   <LanguageToggle variant="dropdown" />   // 드롭다운 형태
 *
 * 선택은 localStorage `i18nextLng`에 자동 저장되어 다음 방문 시 유지.
 */
import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

export interface LanguageToggleProps {
  variant?: "inline" | "dropdown";
  className?: string;
}

const FLAGS: Record<SupportedLanguage, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
};

const LABELS: Record<SupportedLanguage, string> = {
  ko: "한국어",
  en: "English",
};

export function LanguageToggle({
  variant = "inline",
  className = "",
}: LanguageToggleProps) {
  const { i18n, t } = useTranslation();

  // i18next는 "ko-KR" → "ko"로 정규화하지만, 안전하게 첫 2글자만 사용
  const current = (i18n.resolvedLanguage?.slice(0, 2) ??
    i18n.language?.slice(0, 2) ??
    "en") as SupportedLanguage;

  const setLang = (lng: SupportedLanguage) => {
    void i18n.changeLanguage(lng);
  };

  if (variant === "dropdown") {
    return (
      <select
        aria-label={t("language.label")}
        value={current}
        onChange={(e) => setLang(e.target.value as SupportedLanguage)}
        className={`rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs ${className}`}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {FLAGS[lng]} {LABELS[lng]}
          </option>
        ))}
      </select>
    );
  }

  // inline: 두 언어 버튼 나란히
  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => setLang(lng)}
            aria-pressed={active}
            className={`rounded px-2 py-0.5 text-xs transition ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            title={LABELS[lng]}
          >
            <span aria-hidden>{FLAGS[lng]}</span>
            <span className="ml-1">{lng.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;
