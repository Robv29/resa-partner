"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, TriangleAlert, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass } from "@/components/ui";

// Self-service "mot de passe oublié" : avant cette page, seul un admin
// pouvait renvoyer une invitation pour réinitialiser un mot de passe.
// Le template email "Reset Password" de Supabase est déjà configuré pour
// pointer vers /auth/confirm?token_hash=...&type=recovery&next=/set-password
// (cf. correctif du flow PKCE), donc resetPasswordForEmail suffit ici.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/confirm`,
    });
    setLoading(false);
    // On affiche toujours le même message de succès, que l'email existe ou
    // non dans la base, pour ne pas permettre à quelqu'un de vérifier
    // quelles adresses ont un compte.
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-lg p-6 space-y-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent-ink">
          <KeyRound className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-ink tracking-[-0.01em]">Mot de passe oublié</h1>
          <p className="text-sm text-ink-soft mt-1">
            Indiquez votre email : si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        {sent ? (
          <p className="flex items-start gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
            Si cet email est associé à un compte, un lien de réinitialisation vient d'être envoyé.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@site.fr"
              className={inputClass}
            />
            {error && (
              <p className="flex items-start gap-1.5 text-sm text-red-600">
                <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className={buttonClass("primary", "w-full py-2.5")}>
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <Link href="/login" className="block text-xs text-ink-faint hover:text-ink-soft text-center pt-1">
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
