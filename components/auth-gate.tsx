"use client";

import { Dumbbell, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthStatus = "checking" | "unauthenticated" | "authenticated" | "no-backend";
type AuthMode = "login" | "register";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/session", { method: "GET", cache: "no-store" });
      const payload = await response.json().catch(() => null);
      setStatus(payload?.authenticated ? "authenticated" : "unauthenticated");
    } catch {
      setStatus("unauthenticated");
    }
  }

  async function submit() {
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 503) {
          setStatus("no-backend");
          return;
        }
        setError(payload?.error ?? "Une erreur est survenue.");
        return;
      }

      setStatus("authenticated");
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-[430px] overflow-hidden p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Dumbbell className="size-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">IronTrack</p>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
              {status === "checking"
                ? "Vérification..."
                : mode === "login"
                  ? "Connexion"
                  : "Créer un compte"}
            </h2>
          </div>
        </div>

        {status === "no-backend" ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
              <p className="mb-2 font-medium text-foreground">Configuration requise</p>
              <p>
                Ajoutez <code className="text-accent">DATABASE_URL</code> dans les variables
                d&apos;environnement du serveur pour activer les comptes utilisateurs.
              </p>
            </div>
          </div>
        ) : null}

        {status === "checking" ? (
          <div className="rounded-[24px] border border-white/8 bg-white/4 p-4 text-sm text-muted-foreground">
            Vérification de la session en cours...
          </div>
        ) : null}

        {status === "unauthenticated" ? (
          <>
            <div className="mb-5 flex rounded-[16px] border border-white/8 bg-white/4 p-1">
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] py-2 text-sm font-medium transition-all ${mode === "login" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => switchMode("login")}
              >
                <LogIn className="size-4" />
                Connexion
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] py-2 text-sm font-medium transition-all ${mode === "register" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => switchMode("register")}
              >
                <UserPlus className="size-4" />
                Inscription
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submit()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    placeholder={mode === "register" ? "8 caractères minimum" : ""}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void submit()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" ? (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void submit()}
                  />
                </div>
              ) : null}

              {error ? (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              ) : null}

              <Button
                className="w-full accent-pulse"
                size="lg"
                disabled={
                  isSubmitting ||
                  !email.trim() ||
                  !password ||
                  (mode === "register" && !confirmPassword)
                }
                onClick={() => void submit()}
              >
                {isSubmitting
                  ? "..."
                  : mode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
              </Button>

              {mode === "login" ? (
                <p className="text-center text-xs text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <button
                    className="text-accent hover:underline"
                    onClick={() => switchMode("register")}
                  >
                    S&apos;inscrire
                  </button>
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Déjà un compte ?{" "}
                  <button
                    className="text-accent hover:underline"
                    onClick={() => switchMode("login")}
                  >
                    Se connecter
                  </button>
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
