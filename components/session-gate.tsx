"use client";

import { Shield, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SessionStatus = "checking" | "locked" | "unlocked" | "misconfigured";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/session", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!payload?.configured) {
        setStatus("misconfigured");
        return;
      }

      setStatus(payload?.authenticated ? "unlocked" : "locked");
    } catch (sessionError) {
      console.error("Session check failed", sessionError);
      setError("Impossible de verifier la session.");
      setStatus("locked");
    }
  }

  async function unlock() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Code d'acces invalide.");
        return;
      }

      setAccessCode("");
      setStatus("unlocked");
    } catch (sessionError) {
      console.error("Session unlock failed", sessionError);
      setError("Connexion impossible. Reessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "unlocked") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-[430px] overflow-hidden p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            {status === "misconfigured" ? (
              <ShieldAlert className="size-6" />
            ) : (
              <Shield className="size-6" />
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">IronTrack</p>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
              {status === "checking" ? "Verification d'acces..." : "Acces personnel securise"}
            </h2>
          </div>
        </div>

        <div className="mb-6 rounded-[24px] border border-white/8 bg-white/4 p-4 text-sm text-muted-foreground">
          {status === "misconfigured" ? (
            <p>
              Configurez `APP_ACCESS_CODE` sur le serveur. Ajoutez aussi `SESSION_SECRET` si vous
              voulez une cle de signature dediee.
            </p>
          ) : (
            <p>
              Cette version publique est protegee par un code d&apos;acces pour eviter qu&apos;un tiers lise
              ou ecrase vos seances.
            </p>
          )}
        </div>

        {status === "checking" ? (
          <div className="rounded-[24px] border border-white/8 bg-white/4 p-4 text-sm text-muted-foreground">
            Controle de la session en cours...
          </div>
        ) : null}

        {status === "locked" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Code d&apos;acces</Label>
              <Input
                id="access-code"
                type="password"
                autoComplete="current-password"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void unlock();
                  }
                }}
              />
            </div>

            {error ? <p className="text-sm text-amber-300">{error}</p> : null}

            <Button
              className="w-full accent-pulse"
              size="lg"
              disabled={isSubmitting || accessCode.trim().length === 0}
              onClick={() => void unlock()}
            >
              {isSubmitting ? "Verification..." : "Debloquer l&apos;app"}
            </Button>
          </div>
        ) : null}

        {status === "misconfigured" ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Variables d&apos;environnement attendues :</p>
            <p>`APP_ACCESS_CODE`</p>
            <p>`SESSION_SECRET` optionnelle, sinon le code d&apos;acces est reutilise comme cle.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
