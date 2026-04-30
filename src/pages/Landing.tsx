import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { BarChart3, Leaf, Sprout, ChevronRight, LogOut, Droplets, Sun, Cpu } from "lucide-react";
import heroImage from "@/assets/sunrise-farm-hero.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero with image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Sunrise over a lush farm"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          <div className="absolute inset-0 gradient-mesh opacity-70" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/20 backdrop-blur-md p-2 ring-1 ring-primary/40">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg">{t.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => { await signOut(); }}
                className="rounded-xl border-border/60 backdrop-blur-md bg-background/40"
              >
                <LogOut className="h-4 w-4" />
                {t.signOut}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="rounded-xl bg-sunrise text-primary-foreground border-0 shadow-warm hover:opacity-95"
              >
                {t.signIn}
              </Button>
            )}
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-12 pb-32 md:pt-20 md:pb-44">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/30 mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary-foreground/90 font-medium tracking-wide">
                {t.tagline}
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6">
              Smarter farms,
              <br />
              <span className="text-gradient-sunrise">greener tomorrow.</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-xl mb-8 leading-relaxed">
              Hybrid Machine Learning meets a living Digital Twin of your field —
              irrigate exactly when, where, and how much your crop needs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/farmer" : "/auth")}
                className="rounded-2xl h-14 px-8 bg-sunrise text-primary-foreground font-semibold border-0 shadow-warm hover:opacity-95 text-base"
              >
                <Sprout className="h-5 w-5" />
                {user ? t.farmerPortal : "Get started"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(user ? "/admin" : "/auth")}
                className="rounded-2xl h-14 px-8 border-border/60 bg-background/40 backdrop-blur-md text-base"
              >
                <BarChart3 className="h-5 w-5" />
                {t.adminPortal}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative -mt-20 z-20 max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-3 gap-3 md:gap-6 rounded-3xl bg-card-gradient border border-border/60 p-4 md:p-8 shadow-card-soft backdrop-blur-xl">
          {[
            { icon: Droplets, value: "46%", label: "Water saved" },
            { icon: Sun, value: "3", label: "ML stages" },
            { icon: Cpu, value: "ESP32", label: "Edge sensors" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 md:gap-4">
              <div className="rounded-2xl bg-primary/10 p-2.5 md:p-3 ring-1 ring-primary/20">
                <s.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <div className="font-display text-2xl md:text-4xl text-gradient-sunrise leading-none">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Portal cards */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl mb-3">{t.choosePortal}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Two experiences, one intelligent system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(user ? "/admin" : "/auth")}
            className="group text-left rounded-3xl border border-border/60 bg-card-gradient hover:border-primary/40 transition-all p-7 hover:-translate-y-1 hover:shadow-warm grain"
          >
            <div className="rounded-2xl bg-primary/15 ring-1 ring-primary/30 p-3.5 w-fit mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-2xl mb-2">{t.adminPortal}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t.adminDashDesc}
            </p>
            <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
              <span>{t.pipelineDesc}</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate(user ? "/farmer" : "/auth")}
            className="group text-left rounded-3xl border border-border/60 bg-card-gradient hover:border-accent/40 transition-all p-7 hover:-translate-y-1 hover:shadow-warm grain"
          >
            <div className="rounded-2xl bg-accent/15 ring-1 ring-accent/30 p-3.5 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Sprout className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-display text-2xl mb-2">{t.farmerPortal}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t.farmerPortalDesc}
            </p>
            <div className="flex items-center gap-1.5 text-accent text-sm font-medium">
              <span>English • हिन्दी • ಕನ್ನಡ</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      <footer className="border-t border-border/40 py-6 text-center">
        <p className="text-xs text-muted-foreground">{t.teamCredit}</p>
      </footer>
    </div>
  );
};

export default Landing;
