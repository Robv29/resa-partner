import { redirect } from "next/navigation";
import { Building2, Link2, ShieldCheck, UserRound, Ban, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";
import { createAdminInvite, revokeAdminInvite, toggleOrganizationStatus } from "./actions";
import { panelClass, inputClass, labelClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import SubmitButton from "@/components/ui/SubmitButton";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: { invite_token?: string };
}) {
  // Un admin "normal" n'a pas accès à cette console (réservée à Résa
  // Partner) : redirection propre plutôt qu'une page d'erreur s'il tape
  // l'URL directement (le lien n'apparaît de toute façon que pour le
  // super_admin dans le menu).
  const auth = await requireAdmin();
  if (auth.role !== "super_admin") redirect("/admin");
  const supabase = createClient();

  const [{ data: organizations }, { data: profiles }, { data: sites }, { data: invites }] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, role, organization_id").in("role", ["admin", "super_admin"]),
    supabase.from("sites").select("id, organization_id, active"),
    supabase
      .from("admin_invites")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const adminsByOrg = new Map<string, { full_name: string; email: string }[]>();
  for (const p of profiles || []) {
    if (!p.organization_id || p.role !== "admin") continue;
    const list = adminsByOrg.get(p.organization_id) || [];
    list.push({ full_name: p.full_name, email: p.email });
    adminsByOrg.set(p.organization_id, list);
  }
  const siteCountByOrg = new Map<string, number>();
  for (const s of sites || []) {
    siteCountByOrg.set(s.organization_id, (siteCountByOrg.get(s.organization_id) || 0) + (s.active ? 1 : 0));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const freshInvite = (invites || []).find((i: any) => i.token === searchParams.invite_token);

  const statusLabel: Record<string, string> = { active: "Active", suspended: "Suspendue", trialing: "Essai" };
  const statusColor: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    suspended: "bg-red-50 text-red-600",
    trialing: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        description="Tous les comptes admin de Résa Partner — 25€/mois par site actif."
      />

      {freshInvite && (
        <Reveal className={`${panelClass} p-5 !border-gold bg-gold-soft/40`}>
          <p className="flex items-center gap-2 text-sm font-medium text-gold-ink">
            <Link2 className="h-4 w-4" strokeWidth={2} />
            Lien d'inscription créé pour {freshInvite.email}
          </p>
          <p className="text-xs text-ink-faint mt-1 mb-2">
            Envoie ce lien au futur admin — il y renseigne son entreprise et crée son compte lui-même. Valable 14 jours.
          </p>
          <code className="block text-xs bg-white border border-border rounded-md px-3 py-2 text-ink break-all">
            {appUrl}/onboarding/{freshInvite.token}
          </code>
        </Reveal>
      )}

      <div className="grid grid-cols-3 gap-6">
        <StaggerGroup className="col-span-2 space-y-2" staggerDelay={0.05}>
          {(organizations || []).map((org: any) => {
            const admins = adminsByOrg.get(org.id) || [];
            const nbSites = siteCountByOrg.get(org.id) || 0;
            return (
              <StaggerItem
                key={org.id}
                className={`${panelClass} p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_-4px_rgba(15,23,30,0.10)]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold-soft text-gold-ink shrink-0">
                      <Building2 className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{org.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[org.status]}`}>
                          {statusLabel[org.status] || org.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {nbSites} site{nbSites !== 1 ? "s" : ""} actif{nbSites !== 1 ? "s" : ""} · {nbSites * 25}€/mois estimé
                      </p>
                      {admins.length > 0 && (
                        <p className="text-xs text-ink-faint mt-0.5">
                          Admin{admins.length > 1 ? "s" : ""} : {admins.map((a) => a.full_name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <form action={toggleOrganizationStatus}>
                    <input type="hidden" name="organization_id" value={org.id} />
                    <input type="hidden" name="current_status" value={org.status} />
                    <SubmitButton
                      variant="ghost"
                      className={`!px-2 !py-1 text-xs ${org.status === "suspended" ? "text-emerald-700 hover:text-emerald-800" : "text-red-600 hover:text-red-700"}`}
                      pendingText="…"
                      confirmMessage={
                        org.status === "suspended"
                          ? `Réactiver ${org.name} ?`
                          : `Suspendre ${org.name} ? Plus personne (admin, managers, clients) ne pourra accéder à ses sites.`
                      }
                    >
                      {org.status === "suspended" ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />Réactiver</span>
                      ) : (
                        <span className="flex items-center gap-1"><Ban className="h-3.5 w-3.5" strokeWidth={2} />Suspendre</span>
                      )}
                    </SubmitButton>
                  </form>
                </div>
              </StaggerItem>
            );
          })}
          {(organizations || []).length === 0 && (
            <div className={`${panelClass} p-8 text-center`}>
              <p className="text-sm text-ink-faint">Aucune organisation pour le moment.</p>
            </div>
          )}

          {(invites || []).length > 0 && (
            <Reveal delay={0.1} className="pt-4">
              <h2 className="font-medium text-sm text-ink-soft mb-2">Invitations en attente</h2>
              <div className="space-y-2">
                {(invites || []).map((inv: any) => (
                  <div key={inv.id} className={`${panelClass} flex items-center justify-between p-3 text-sm`}>
                    <div>
                      <span className="text-ink">{inv.email}</span>
                      {inv.company_name && <span className="text-ink-faint"> — {inv.company_name}</span>}
                    </div>
                    <form action={revokeAdminInvite}>
                      <input type="hidden" name="invite_id" value={inv.id} />
                      <SubmitButton
                        variant="ghost"
                        className="!px-0 !py-0 text-xs text-red-600 hover:text-red-700 hover:bg-transparent"
                        pendingText="…"
                        confirmMessage="Annuler cette invitation ?"
                      >
                        Annuler
                      </SubmitButton>
                    </form>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <h2 className="font-medium text-sm text-ink-soft mb-2">Inviter un nouvel admin</h2>
          <form action={createAdminInvite} className={`${panelClass} p-4 space-y-3`}>
            <div>
              <label className={labelClass}>Email du futur admin</label>
              <input name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Entreprise (optionnel)</label>
              <input name="company_name" placeholder="Pré-rempli s'il le change" className={inputClass} />
            </div>
            <p className="text-xs text-ink-faint">
              Génère un lien à usage unique. C'est le futur admin qui crée son organisation et son compte en le
              remplissant — rien n'est créé tant qu'il ne l'a pas fait.
            </p>
            <SubmitButton variant="primary" className="w-full" pendingText="Génération…">
              Générer le lien
            </SubmitButton>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
