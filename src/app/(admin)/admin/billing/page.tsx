import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEUR, lastMonths, monthRange } from "@/lib/format";
import BillingFilters from "./BillingFilters";
import CopyPlatesButton from "./CopyPlatesButton";
import { panelClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import Reveal, { StaggerTBody, StaggerRow } from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import { requireAdmin, getScopedOrgId } from "@/lib/auth-guard";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { site?: string; month?: string };
}) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);

  if (!orgId) {
    return (
      <div className="space-y-5">
        <PageHeader title="Facturation" description="Détail par option, prêt à copier pour ta facture." />
        <div className={`${panelClass} p-8 text-center text-sm text-ink-faint`}>
          Sélectionne une organisation dans le sélecteur en haut de page pour voir sa facturation.
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const { data: sites } = await supabase.from("sites").select("id, name").eq("organization_id", orgId).order("name");

  const months = lastMonths(12);
  const currentMonth = searchParams.month || months[0].value;
  const currentSite = searchParams.site || sites?.[0]?.id || "";

  if (!currentSite) {
    return (
      <div className={`${panelClass} p-8 text-center`}>
        <p className="text-sm text-ink-faint">Créez d'abord un site pour accéder à la facturation.</p>
      </div>
    );
  }

  const { start, end } = monthRange(currentMonth);

  // Facturable = prestations réellement terminées dans le mois (on exclut
  // les demandes annulées, en attente, et celles seulement planifiées mais
  // pas encore effectuées — on ne facture que le travail fait).
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, plate, scheduled_date, status, booking_options(option_name, price)")
    .eq("site_id", currentSite)
    .gte("scheduled_date", start)
    .lt("scheduled_date", end)
    .eq("status", "done");

  type Group = { total: number; plates: Set<string> };
  const byOption = new Map<string, Group>();
  let grandTotal = 0;

  for (const b of bookings || []) {
    for (const bo of (b as any).booking_options || []) {
      const g = byOption.get(bo.option_name) || { total: 0, plates: new Set<string>() };
      g.total += Number(bo.price);
      g.plates.add((b as any).plate);
      byOption.set(bo.option_name, g);
      grandTotal += Number(bo.price);
    }
  }

  const rows = Array.from(byOption.entries()).sort((a, b) => b[1].total - a[1].total);
  const siteName = sites?.find((s) => s.id === currentSite)?.name || "";

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Facturation — ${siteName}`}
        description="Détail par option, prêt à copier pour ta facture."
        actions={<BillingFilters sites={sites || []} months={months} currentSite={currentSite} currentMonth={currentMonth} />}
      />

      <Reveal className={`${panelClass} flex items-center justify-between p-5`}>
        <span className="flex items-center gap-2 text-sm text-ink-soft">
          <Receipt className="h-4 w-4 text-ink-faint" strokeWidth={2} />
          Total à facturer sur la période
        </span>
        <span className="text-2xl font-semibold text-ink tabular-nums">
          <Counter value={grandTotal} format="eur" />
        </span>
      </Reveal>

      <Reveal delay={0.05} className={panelClass}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-faint border-b border-border">
              <th className="py-3 px-5 font-medium">Option</th>
              <th className="py-3 px-4 font-medium">Nb véhicules</th>
              <th className="py-3 px-4 font-medium">Sous-total</th>
              <th className="py-3 px-5 font-medium">Plaques concernées</th>
            </tr>
          </thead>
          <StaggerTBody staggerDelay={0.05}>
            {rows.map(([optionName, g]) => (
              <StaggerRow key={optionName} className="border-b border-border last:border-0 align-top transition-colors hover:bg-black/[0.015]">
                <td className="py-3 px-5 font-medium text-ink">{optionName}</td>
                <td className="py-3 px-4 text-ink-soft tabular-nums">{g.plates.size}</td>
                <td className="py-3 px-4 font-semibold text-ink tabular-nums">{formatEUR(g.total)}</td>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <span className="text-ink-faint font-mono text-xs">{Array.from(g.plates).join(", ")}</span>
                    <CopyPlatesButton plates={Array.from(g.plates)} />
                  </div>
                </td>
              </StaggerRow>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 px-5 text-center text-ink-faint">
                  Aucune prestation facturable sur cette période.
                </td>
              </tr>
            )}
          </StaggerTBody>
        </table>
      </Reveal>
    </div>
  );
}
