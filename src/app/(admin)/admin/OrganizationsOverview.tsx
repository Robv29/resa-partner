import Link from "next/link";
import { Building2, ArrowRight, CarFront } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEUR, lastMonths, monthRange } from "@/lib/format";
import { panelClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";

// Vue "toutes organisations" pour le super_admin : pilotage business global
// (MRR estimé, nb de comptes, nb de sites) plutôt que le planning d'un seul
// compte. Affichée sur /admin quand aucune organisation n'est sélectionnée
// dans le switcher du header.
export default async function OrganizationsOverview() {
  const supabase = createClient();
  const [curMonth] = lastMonths(1);
  const { start, end } = monthRange(curMonth.value);

  const [{ data: organizations }, { data: sites }, { data: doneThisMonth }] = await Promise.all([
    supabase.from("organizations").select("id, name, status"),
    supabase.from("sites").select("id, organization_id, active"),
    supabase
      .from("bookings")
      .select("organization_id, booking_options(price)")
      .eq("status", "done")
      .gte("scheduled_date", start)
      .lt("scheduled_date", end),
  ]);

  const activeSitesByOrg = new Map<string, number>();
  let totalActiveSites = 0;
  for (const s of sites || []) {
    if (!s.active) continue;
    totalActiveSites += 1;
    activeSitesByOrg.set(s.organization_id, (activeSitesByOrg.get(s.organization_id) || 0) + 1);
  }

  const caByOrg = new Map<string, number>();
  for (const b of doneThisMonth || []) {
    const total = ((b as any).booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
    caByOrg.set((b as any).organization_id, (caByOrg.get((b as any).organization_id) || 0) + total);
  }

  const mrrEstimate = totalActiveSites * 25;
  const activeOrgs = (organizations || []).filter((o: any) => o.status === "active").length;

  const rows = (organizations || [])
    .map((o: any) => ({
      id: o.id,
      name: o.name,
      status: o.status,
      nbSites: activeSitesByOrg.get(o.id) || 0,
      ca: caByOrg.get(o.id) || 0,
    }))
    .sort((a, b) => b.nbSites - a.nbSites);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vue d'ensemble — toutes organisations"
        description="Pilotage global Résa Partner. Sélectionne une organisation dans le menu du haut pour gérer son compte."
      />

      <StaggerGroup className={`${panelClass} grid grid-cols-3 divide-x divide-border`}>
        <StaggerItem className="p-5">
          <p className="text-xs text-ink-faint mb-2">MRR estimé (25€ / site actif)</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">
            <Counter value={mrrEstimate} format="eur" />
          </p>
        </StaggerItem>
        <StaggerItem className="p-5">
          <p className="text-xs text-ink-faint mb-2">Organisations actives</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">
            <Counter value={activeOrgs} /> <span className="text-base text-ink-faint">/ {(organizations || []).length}</span>
          </p>
        </StaggerItem>
        <StaggerItem className="p-5">
          <p className="text-xs text-ink-faint mb-2">Sites actifs (tous comptes)</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">
            <Counter value={totalActiveSites} />
          </p>
        </StaggerItem>
      </StaggerGroup>

      <div className={panelClass}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-sm text-ink">Organisations</h2>
          <Link href="/admin/organizations" className="flex items-center gap-1 text-sm text-accent-ink hover:underline">
            Gérer, inviter un admin <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <StaggerGroup className="divide-y divide-border" staggerDelay={0.04}>
          {rows.length === 0 && (
            <div className="p-8 text-center">
              <CarFront className="h-6 w-6 mx-auto text-ink-faint mb-2 animate-bob" strokeWidth={1.5} />
              <p className="text-sm text-ink-faint">Aucune organisation pour le moment.</p>
            </div>
          )}
          {rows.map((o) => (
            <StaggerItem key={o.id} className="px-5 py-3.5 flex items-center justify-between text-sm transition-colors hover:bg-black/[0.015]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.04] text-ink-faint">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="font-medium text-ink">{o.name}</span>
                {o.status !== "active" && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium capitalize">{o.status}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-ink tabular-nums">{formatEUR(o.ca)}</p>
                <p className="text-xs text-ink-faint">{o.nbSites} site{o.nbSites !== 1 ? "s" : ""}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  );
}
