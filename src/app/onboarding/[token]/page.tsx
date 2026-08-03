import Image from "next/image";
import { TriangleAlert, Building2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeOnboarding } from "./actions";
import { inputClass, labelClass } from "@/components/ui";
import SubmitButton from "@/components/ui/SubmitButton";
import Reveal from "@/components/motion/Reveal";

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("admin_invites")
    .select("email, company_name, status, expires_at")
    .eq("token", params.token)
    .single();

  const isExpired = invite && (invite.status !== "pending" || new Date(invite.expires_at) < new Date());
  const isInvalid = !invite || isExpired;

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-bg">
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

        {isInvalid ? (
          <Reveal delay={0.08} className="bg-surface border border-border rounded-lg p-6 mt-7 space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <TriangleAlert className="h-4 w-4" strokeWidth={2} />
              Lien invalide ou expiré
            </p>
            <p className="text-sm text-ink-faint">
              Ce lien d'inscription n'est plus valable. Demande un nouveau lien à Résa Partner.
            </p>
          </Reveal>
        ) : (
          <>
            <Reveal delay={0.08}>
              <p className="text-ink-soft mb-7 text-sm">Crée ton compte admin Résa Partner</p>
            </Reveal>
            <Reveal delay={0.16}>
              <form
                action={completeOnboarding}
                className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-[0_12px_32px_-16px_rgba(15,23,30,0.14)]"
              >
                <input type="hidden" name="token" value={params.token} />
                <div>
                  <label className={labelClass}>Email</label>
                  <input value={invite!.email} disabled className={`${inputClass} opacity-60`} />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Nom de ton entreprise
                    </span>
                  </label>
                  <input
                    name="company_name"
                    required
                    autoFocus
                    defaultValue={invite!.company_name || ""}
                    placeholder="Ex: Concessions Dupont"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Ton nom complet</label>
                  <input name="full_name" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mot de passe</label>
                  <input name="password" type="password" required minLength={8} className={inputClass} />
                  <p className="text-xs text-ink-faint mt-1">8 caractères minimum.</p>
                </div>

                {searchParams.error && (
                  <p className="flex items-start gap-1.5 text-sm text-red-600 animate-pop">
                    <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                    {decodeURIComponent(searchParams.error)}
                  </p>
                )}

                <SubmitButton variant="primary" className="w-full py-2.5" pendingText="Création du compte…">
                  Créer mon compte
                </SubmitButton>
              </form>
            </Reveal>
            <Reveal delay={0.22}>
              <p className="text-xs text-ink-faint mt-4 text-center">
                Le paiement (25€/mois par site) sera configuré à ta première création de site.
              </p>
            </Reveal>
          </>
        )}
      </div>
    </main>
  );
}
