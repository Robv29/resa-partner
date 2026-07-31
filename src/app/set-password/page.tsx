"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h1 className="text-lg font-bold text-brand">Bienvenue chez VGS Autos</h1>
        <p className="text-sm text-slate-500">Choisissez votre mot de passe pour activer votre accès.</p>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe (8 caractères min.)"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white rounded-md py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "…" : "Activer mon compte"}
        </button>
      </form>
    </main>
  );
}
