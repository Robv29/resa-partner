import Image from "next/image";
import { TriangleAlert } from "lucide-react";
import { signIn } from "./actions";
import { inputClass, labelClass } from "@/components/ui";
import SubmitButton from "@/components/ui/SubmitButton";
import Reveal from "@/components/motion/Reveal";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-bg">
      {/* Deux halos qui dérivent doucement, aux couleurs de la marque (navy + or) */}
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-accent/10 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-96 w-[30rem] rounded-full bg-gold/10 blur-3xl animate-float"
        style={{ animationDelay: "-4.5s" }}
      />

      <div className="relative w-full max-w-sm">
        <Reveal>
          <div className="mb-1 animate-bob" style={{ animationDelay: "0.4s" }}>
            <Image src="/logo-full.png" alt="Résa Partner" width={220} height={220} className="h-24 w-auto" priority />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-ink-soft mb-7 text-sm">Espace de réservation nettoyage automobile</p>
        </Reveal>

        <Reveal delay={0.16}>
          <form action={signIn} className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-[0_12px_32px_-16px_rgba(15,23,30,0.14)]">
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
              <p className="flex items-start gap-1.5 text-sm text-red-600 animate-pop">
                <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                {decodeURIComponent(searchParams.error)}
              </p>
            )}

            <SubmitButton variant="primary" className="w-full py-2.5" pendingText="Connexion…">
              Se connecter
            </SubmitButton>
          </form>
        </Reveal>
        <Reveal delay={0.22}>
          <div className="flex items-center justify-between mt-3">
            <a href="/forgot-password" className="text-xs text-ink-faint hover:text-ink-soft underline">
              Mot de passe oublié ?
            </a>
          </div>
          <p className="text-xs text-ink-faint mt-4 text-center">
            Pas encore de compte ? Contactez Résa Partner pour recevoir votre invitation.
          </p>
        </Reveal>
      </div>
    </main>
  );
}
