import { Droplets, TriangleAlert } from "lucide-react";
import { signIn } from "./actions";
import { inputClass, labelClass, buttonClass } from "@/components/ui";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
            <Droplets className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h1 className="text-lg font-semibold text-ink tracking-[-0.01em]">VGS Autos</h1>
        </div>
        <p className="text-ink-soft mb-7 text-sm">Espace de réservation nettoyage automobile</p>

        <form action={signIn} className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className={inputClass}
              placeholder="contact@site.fr"
            />
          </div>
          <div>
            <label className={labelClass}>Mot de passe</label>
            <input name="password" type="password" required className={inputClass} />
          </div>

          {searchParams.error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600">
              <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
              {decodeURIComponent(searchParams.error)}
            </p>
          )}

          <button type="submit" className={buttonClass("primary", "w-full py-2.5")}>
            Se connecter
          </button>
        </form>
        <p className="text-xs text-ink-faint mt-4 text-center">
          Pas encore de compte ? Contactez VGS Autos pour recevoir votre invitation.
        </p>
      </div>
    </main>
  );
}
