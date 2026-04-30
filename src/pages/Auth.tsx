import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { Leaf, Loader2, Sprout, ArrowLeft } from "lucide-react";
import heroImage from "@/assets/sunrise-farm-hero.jpg";

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(80);

const REMEMBER_KEY = "irrigation-remember-email";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const from = (location.state as any)?.from || "/";

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const persistRemember = () => {
    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (mode === "signup") nameSchema.parse(fullName);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        persistRemember();
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: fullName,
              farm_name: farmName || null,
            },
          },
        });
        if (error) throw error;
        persistRemember();
        toast.success("Account created! Welcome 🌱");
      }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      if (msg.toLowerCase().includes("already registered")) {
        toast.error("Email already registered. Try signing in.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        setOauthLoading(false);
        return;
      }
      if (result.redirected) return;
    } catch {
      toast.error("Google sign-in failed");
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Hero panel */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden">
        <img
          src={heroImage}
          alt="Sunrise over farm fields"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/20 to-background/80" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-foreground w-full">
          <Link to="/" className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{t.back}</span>
          </Link>
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 backdrop-blur-md border border-foreground/20">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Hybrid ML & Digital Twin</span>
            </div>
            <h1 className="font-display text-5xl xl:text-6xl leading-tight">
              Grow more.<br />
              <span className="text-gradient-sunrise">Waste less water.</span>
            </h1>
            <p className="text-foreground/80 text-base xl:text-lg leading-relaxed">
              AI-powered irrigation that learns your soil, your crops, and your weather — saving up to 46% water.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/15 p-2 ring-1 ring-primary/30">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg">{t.appName}</span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <Card className="w-full max-w-md p-8 bg-card-gradient border-border/60 shadow-card-soft">
            <div className="mb-6">
              <h2 className="font-display text-3xl mb-2">
                {mode === "signin" ? t.authWelcome : "Join the harvest"}
              </h2>
              <p className="text-sm text-muted-foreground">{t.authSubtitle}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl border-border/80 hover:bg-secondary"
              onClick={handleGoogle}
              disabled={oauthLoading || loading}
            >
              {oauthLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.1 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1 7.4 2.8l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1 7.4 2.8l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.8 8.7 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5.1l-6-4.9C28.9 35 26.6 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.7 39.3 16.3 43.5 24 43.5z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.4 5.5l6 4.9c-.4.4 6.6-4.8 6.6-14.4 0-1.2-.1-2.4-.5-3.5z"/>
                </svg>
              )}
              {t.continueWithGoogle}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                  {t.orContinueWith}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t.fullName}</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ravi Kumar"
                      className="h-11 rounded-xl bg-secondary/50 border-border/60"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="farm">{t.farmName} <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      id="farm"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="Green Valley Farm"
                      className="h-11 rounded-xl bg-secondary/50 border-border/60"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@farm.com"
                  className="h-11 rounded-xl bg-secondary/50 border-border/60"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl bg-secondary/50 border-border/60"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(c) => setRemember(c === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  {t.rememberMe}
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading || oauthLoading}
                className="w-full h-11 rounded-xl bg-sunrise text-primary-foreground font-semibold hover:opacity-95 shadow-warm border-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "signin" ? t.signingIn : t.creatingAccount}
                  </>
                ) : (
                  mode === "signin" ? t.signIn : t.signUp
                )}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="block w-full text-center mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "signin" ? t.noAccount : t.haveAccount}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
