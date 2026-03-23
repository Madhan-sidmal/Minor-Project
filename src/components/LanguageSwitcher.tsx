import { Language, languageNames } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  const langs: Language[] = ["en", "hi", "kn"];

  return (
    <div className="flex items-center gap-1.5">
      {!compact && <Globe className="h-4 w-4 text-muted-foreground" />}
      <div className="flex rounded-lg border border-border bg-secondary/50 overflow-hidden">
        {langs.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              lang === l
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {compact ? l.toUpperCase() : languageNames[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
