import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BarChart3, Leaf, Sprout, ChevronRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-semibold">{t.appName}</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-primary font-medium">{t.tagline}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">{t.appName}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t.choosePortal}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Admin Dashboard */}
          <button
            onClick={() => navigate("/admin")}
            className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:glow-green transition-all p-6 text-left"
          >
            <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-1">{t.adminPortal}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t.adminDashDesc}</p>
            <div className="flex items-center gap-1 text-primary text-sm font-medium">
              <span>{t.pipelineDesc}</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Farmer Portal */}
          <button
            onClick={() => navigate("/farmer")}
            className="group rounded-2xl border border-border bg-card hover:border-accent/40 hover:glow-amber transition-all p-6 text-left"
          >
            <div className="rounded-xl bg-accent/10 p-3 w-fit mb-4 group-hover:bg-accent/20 transition-colors">
              <Sprout className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-1">{t.farmerPortal}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t.farmerPortalDesc}</p>
            <div className="flex items-center gap-1 text-accent text-sm font-medium">
              <span>English • हिन्दी • ಕನ್ನಡ</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">{t.teamCredit}</p>
      </footer>
    </div>
  );
};

export default Landing;
