import { UserRound, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { inviteManager, removeManager } from "./actions";
import { panelClass, inputClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import SubmitButton from "@/components/ui/SubmitButton";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { requireAdmin, getScopedOrgId } from "@/lib/auth-guard";

export default async function ManagersPage() {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Équipe interne" description="Managers et admins qui reçoivent les notifications de planification." />
        <div className={`${panelClass} p-8 text-center text-sm text-ink-faint`}>
          Sélectionne une organisation dans le sélecteur en haut de page pour voir son équipe.
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const { data: team } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("organization_id", orgId)
    .in("role", ["admin", "manager"])
    .order("role");

  return (
    <div className="space-y-6">
      <PageHeader title="Équipe interne" description="Managers et admins qui reçoivent les notifications de planification." />

      <div className="grid grid-cols-3 gap-6">
        <StaggerGroup className="col-span-2 space-y-2" staggerDelay={0.05}>
          {(team || []).map((m: any) => (
            <StaggerItem
              key={m.id}
              className={`${panelClass} flex items-center justify-between p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_-4px_rgba(15,23,30,0.10)]`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    m.role === "admin" ? "bg-gold-soft text-gold-ink" : "bg-accent-soft text-accent-ink"
                  }`}
                >
                  {m.role === "admin" ? (
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <UserRound className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
                <div>
                  <p className="font-medium text-ink">{m.full_name}</p>
                  <p className="text-xs text-ink-faint">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full capitalize ${
                    m.role === "admin" ? "bg-gold-soft text-gold-ink" : "bg-accent-soft text-accent-ink"
                  }`}
                >
                  {m.role}
                </span>
                {m.role !== "admin" && (
                  <form action={removeManager}>
                    <input type="hidden" name="manager_id" value={m.id} />
                    <SubmitButton
                      variant="ghost"
                      className="!px-0 !py-0 text-xs text-red-600 hover:text-red-700 hover:bg-transparent"
                      pendingText="…"
                      confirmMessage={`Retirer l'accès de ${m.full_name} ? Son compte sera supprimé.`}
                    >
                      Retirer
                    </SubmitButton>
                  </form>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <h2 className="font-medium text-sm text-ink-soft mb-2">Ajouter un membre</h2>
          <form action={inviteManager} className={`${panelClass} p-4 space-y-3`}>
            <input name="full_name" placeholder="Nom" required className={inputClass} />
            <input name="email" type="email" placeholder="Email" required className={inputClass} />
            <p className="text-xs text-ink-faint">
              Rejoint comme manager de cette organisation. La création d'un compte admin (nouvelle organisation) se
              fait depuis la console Résa Partner.
            </p>
            <SubmitButton variant="primary" className="w-full" pendingText="Envoi de l'invitation…">
              Inviter
            </SubmitButton>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
