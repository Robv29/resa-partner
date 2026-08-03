"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass } from "@/components/ui";
import Reveal from "@/components/motion/Reveal";

// Page atteinte via le lien d'invitation Supabase. Le SDK échange
// automatiquement le token présent dans l'URL contre une session
// (detectSessionInUrl), il ne reste qu'à définir le mot de passe.
export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-bg">
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-accent/10 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-96 w-[30rem] rounded-full bg-gold/10 blur-3xl animate-float"
        style={{ animationDelay: "-4.5s" }}
      />
      <Reveal className="relative w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-[0_12px_32px_-16px_rgba(15,23,30,0.14)]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent-ink animate-bob">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-ink tracking-[-0.01em]">Bienvenue sur Résa Partner</h1>
            <p className="text-sm text-ink-soft mt-1">Choisissez votre mot de passe pour activer votre accès.</p>
          </div>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (8 caractères min.)"
            className={inputClass}
            autoFocus
          />
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600 animate-pop">
              <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className={buttonClass("primary", "w-full py-2.5")}>
            {loading ? "Activation…" : "Activer mon compte"}
          </button>
        </form>
      </Reveal>
    </main>
  );
}
