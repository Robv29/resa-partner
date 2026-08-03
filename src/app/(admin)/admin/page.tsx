import Link from "next/link";
import {
  Building2,
  CircleDashed,
  CalendarClock,
  ArrowRight,
  CarFront,
  TrendingUp,
  TrendingDown,
  Minus,
  Ban,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR, formatEUR, todayISO, addDaysISO, lastMonths, monthRange } from "@/lib/format";
import { panelClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import { StaggerGroup, StaggerItem, StaggerTBody, StaggerRow } from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import { requireAdmin, getScopedOrgId } from "@/lib/auth-guard";
import OrganizationsOverview from "./OrganizationsOverview";

// Variation en % entre deux valeurs, avec un statut à part pour "pas de
// référence" (mois précédent à 0) plutôt qu'un pourcentage absurde.
function pctDelta(current: number, previous: number): { pct: number | null; tone: "up" | "down" | "flat" } {
  if (previous === 0) {
    if (current === 0) return { pct: 0, tone: "flat" };
    return { pct: null, tone: "up" };
  }
  const pct = ((current - previous) / previous) * 100;
  return { pct, tone: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat" };
}

function DeltaBadge({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  const { pct, tone } = pctDelta(current, previous);
  const good = invert ? tone === "down" : tone === "up";
  const bad = invert ? tone === "up" : tone === "down";
  const color = good ? "text-emerald-700 bg-emerald-50" : bad ? "text-red-600 bg-red-50" : "text-ink-faint bg-black/[0.04]";
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${color}`}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {pct === null ? "Nouveau" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`}
    </span>
  );
}

export default async function AdminOverview() {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);

  // super_admin sans organisation sélectionnée ("toutes les organisations") :
  // vue business globale plutôt que le tableau de bord d'un seul compte.
  if (!orgId) {
    return <OrganizationsOverview />;
  }

  const supabase = createClient();

  const today = todayISO();
  const in7Days = addDaysISO(7);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [curMonth, prevMonth] = lastMonths(2);
  const { start: curStart, end: curEnd } = monthRange(curMonth.value);
  const { start: prevStart, end: prevEnd } = monthRange(prevMonth.value);

  const [
    { count: siteCount },
    { data: sites },
    { data: pending },
    { count: scheduledUpcoming },
    { data: doneCurrent },
    { data: donePrevious },
    { data: recentOutcomes },
  ] = await Promise.all([
    supabase.from("sites").select("*", { count: "exact", head: true }).eq("active", true).eq("organization_id", orgId),
    supabase.from("sites").select("id, name").eq("active", true).eq("organization_id", orgId).order("name"),
    supabase
      .from("bookings")
      .select("id, plate, brand_model, created_at, site_id, site:sites(name)")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "scheduled")
      .gte("scheduled_date", today)
      .lte("scheduled_date", in7Days),
    supabase
      .from("bookings")
      .select("id, site_id, booking_options(option_name, price)")
      .eq("organization_id", orgId)
      .eq("status", "done")
      .gte("scheduled_date", curStart)
      .lt("scheduled_date", curEnd),
    supabase
      .from("bookings")
      .select("id, booking_options(price)")
      .eq("organization_id", orgId)
      .eq("status", "done")
      .gte("scheduled_date", prevStart)
      .lt("scheduled_date", prevEnd),
    supabase
      .from("bookings")
      .select("status")
      .eq("organization_id", orgId)
      .in("status", ["done", "cancelled"])
      .gte("created_at", thirtyDaysAgo),
  ]);

  // CA + volume du mois en cours, comparés au mois précédent
  const caCurrent = (doneCurrent || []).reduce(
    (sum, b: any) => sum + (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0),
    0
  );
  const caPrevious = (donePrevious || []).reduce(
    (sum, b: any) => sum + (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0),
    0
  );
  const nbCurrent = (doneCurrent || []).length;
  const nbPrevious = (donePrevious || []).length;
  const panierMoyen = nbCurrent > 0 ? caCurrent / nbCurrent : 0;

  // Ancienneté du backlog en attente (signal d'alerte si ça traîne)
  const pendingAges = (pending || []).map((b: any) => (Date.now() - new Date(b.created_at).getTime()) / 86400000);
  const oldestPendingDays = pendingAges.length > 0 ? Math.max(...pendingAges) : 0;

  // Taux de refus (30 derniers jours) : cancelled / (done + cancelled)
  const doneCount30 = (recentOutcomes || []).filter((b: any) => b.status === "done").length;
  const cancelCount30 = (recentOutcomes || []).filter((b: any) => b.status === "cancelled").length;
  const totalOutcomes30 = doneCount30 + cancelCount30;
  const refusalRate = totalOutcomes30 > 0 ? (cancelCount30 / totalOutcomes30) * 100 : 0;

  // Option la plus vendue ce mois (upsell) — dérivé de doneCurrent, sans requête en plus
  const optionTotals = new Map<string, { count: number; total: number }>();
  for (const b of doneCurrent || []) {
    for (const o of (b as any).booking_options || []) {
      const g = optionTotals.get(o.option_name) || { count: 0, total: 0 };
      g.count += 1;
      g.total += Number(o.price);
      optionTotals.set(o.option_name, g);
    }
  }
  const topOption = Array.from(optionTotals.entries()).sort((a, b) => b[1].total - a[1].total)[0];

  // Répartition par site : CA du mois + terminés du mois + backlog en attente
  const caBySite = new Map<string, number>();
  const nbBySite = new Map<string, number>();
  for (const b of doneCurrent || []) {
    const total = ((b as any).booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
    caBySite.set(b.site_id, (caBySite.get(b.site_id) || 0) + total);
    nbBySite.set(b.site_id, (nbBySite.get(b.site_id) || 0) + 1);
  }
  const pendingBySite = new Map<string, number>();
  for (const b of pending || []) {
    pendingBySite.set((b as any).site_id, (pendingBySite.get((b as any).site_id) || 0) + 1);
  }
  const siteRows = (sites || [])
    .map((s: any) => ({
      name: s.name,
      ca: caBySite.get(s.id) || 0,
      nb: nbBySite.get(s.id) || 0,
      pending: pendingBySite.get(s.id) || 0,
    }))
    .sort((a, b) => b.ca - a.ca);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vue d'ensemble"
        description={`Activité ${curMonth.label.toLowerCase()}, tous sites confondus.`}
      />

      {/* Rentabilité du mois */}
      <StaggerGroup className={`${panelClass} grid grid-cols-3 divide-x divide-border`}>
        <StaggerItem className="p-5">
          <p className="text-xs text-ink-faint mb-2">CA facturable ce mois-ci</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-ink">
              <Counter value={caCurrent} format="eur" />
            </p>
            <DeltaBadge current={caCurrent} previous={caPrevious} />
          </div>
          <p className="text-xs text-ink-faint mt-1">vs {formatEUR(caPrevious)} en {prevMonth.label.toLowerCase()}</p>
        </StaggerItem>
        <StaggerItem className="p-5">
          <p className="text-xs text-ink-faint mb-2">Nettoyages terminés ce mois</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums text-ink">
              <Counter value={nbCurrent} />
            </p>
            <DeltaBadge current={nbCurrent} previous={nbPrevious} />
          </div>
          <p className="text-xs text-ink-faint mt-1">vs {nbPrevious} en {prevMonth.label.toLowerCase()}</p>
        </StaggerItem>
        <StaggerItem className="p-5">
          <p className="text-xs text-ink-faint mb-2">Panier moyen / véhicule</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">
            <Counter value={panierMoyen} format="eur" />
          </p>
          <p className="text-xs text-ink-faint mt-1">
            {topOption ? (
              <>Option la + vendue : <span className="text-ink-soft">{topOption[0]}</span> ({topOption[1].count})</>
            ) : (
              "Aucune vente ce mois"
            )}
          </p>
        </StaggerItem>
      </StaggerGroup>

      {/* Exploitation */}
      <StaggerGroup className={`${panelClass} grid grid-cols-4 divide-x divide-border`}>
        <StaggerItem className="relative p-5">
          {(pending?.length ?? 0) > 0 && (
            <span className="absolute right-4 top-4 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" aria-label="Plaques non validées" />
          )}
          <CircleDashed className="h-4 w-4 mb-3 text-amber-600" strokeWidth={2} />
          <p className="text-2xl font-semibold tabular-nums text-amber-600">
            <Counter value={pending?.length ?? 0} />
          </p>
          <p className="text-xs text-ink-faint mt-1">En attente de planification</p>
          {oldestPendingDays >= 1 && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              La plus ancienne attend depuis {Math.floor(oldestPendingDays)} j
            </p>
          )}
        </StaggerItem>
        <StaggerItem className="p-5">
          <CalendarClock className="h-4 w-4 mb-3 text-accent-ink" strokeWidth={2} />
          <p className="text-2xl font-semibold tabular-nums text-accent-ink">
            <Counter value={scheduledUpcoming ?? 0} />
          </p>
          <p className="text-xs text-ink-faint mt-1">Planifiés dans les 7 prochains jours</p>
        </StaggerItem>
        <StaggerItem className="p-5">
          <Ban className="h-4 w-4 mb-3 text-ink-soft" strokeWidth={2} />
          <p className="text-2xl font-semibold tabular-nums text-ink">
            <Counter value={refusalRate} format="percent" />
          </p>
          <p className="text-xs text-ink-faint mt-1">Taux de refus/annulation (30j)</p>
        </StaggerItem>
        <StaggerItem className="p-5">
          <Building2 className="h-4 w-4 mb-3 text-ink" strokeWidth={2} />
          <p className="text-2xl font-semibold tabular-nums text-ink">
            <Counter value={siteCount ?? 0} />
          </p>
          <p className="text-xs text-ink-faint mt-1">Sites actifs</p>
        </StaggerItem>
      </StaggerGroup>

      {/* Demandes en attente */}
      <div className={panelClass}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="flex items-center gap-2 font-medium text-sm text-ink">
            Demandes à planifier en priorité
            {(pending || []).length > 0 && <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />}
          </h2>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-sm text-accent-ink hover:underline">
            Tout voir <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <StaggerGroup className="divide-y divide-border" staggerDelay={0.04}>
          {(pending || []).length === 0 && (
            <div className="p-8 text-center">
              <CarFront className="h-6 w-6 mx-auto text-ink-faint mb-2 animate-bob" strokeWidth={1.5} />
              <p className="text-sm text-ink-faint">Rien en attente, tout est planifié.</p>
            </div>
          )}
          {(pending || []).slice(0, 20).map((b: any) => (
            <StaggerItem
              key={b.id}
              className="px-5 py-3.5 flex items-center justify-between text-sm transition-colors hover:bg-black/[0.015]"
            >
              <div>
                <span className="font-mono font-semibold text-ink tracking-wide">{b.plate}</span>{" "}
                <span className="text-ink-faint">— {b.site?.name}</span>
                <p className="text-xs text-ink-faint mt-0.5">{b.brand_model || "—"}</p>
              </div>
              <span className="text-xs text-ink-faint">déposé le {formatDateFR(b.created_at)}</span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      {/* Répartition par site */}
      <div className={panelClass}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-sm text-ink">Rentabilité par site — {curMonth.label}</h2>
          <Link href="/admin/billing" className="flex items-center gap-1 text-sm text-accent-ink hover:underline">
            Facturation détaillée <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-faint border-b border-border">
              <th className="py-2.5 px-5 font-medium">Site</th>
              <th className="py-2.5 px-4 font-medium">CA ce mois</th>
              <th className="py-2.5 px-4 font-medium">Nettoyages terminés</th>
              <th className="py-2.5 px-5 font-medium">En attente</th>
            </tr>
          </thead>
          <StaggerTBody>
            {siteRows.map((s) => (
              <StaggerRow key={s.name} className="border-b border-border last:border-0 transition-colors hover:bg-black/[0.015]">
                <td className="py-2.5 px-5 text-ink font-medium">{s.name}</td>
                <td className="py-2.5 px-4 text-ink tabular-nums">{formatEUR(s.ca)}</td>
                <td className="py-2.5 px-4 text-ink-soft tabular-nums">{s.nb}</td>
                <td className="py-2.5 px-5 tabular-nums">
                  {s.pending > 0 ? (
                    <span className="text-amber-600 font-medium">{s.pending}</span>
                  ) : (
                    <span className="text-ink-faint">0</span>
                  )}
                </td>
              </StaggerRow>
            ))}
            {siteRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 px-5 text-center text-ink-faint">
                  Aucun site actif pour le moment.
                </td>
              </tr>
            )}
          </StaggerTBody>
        </table>
      </div>
    </div>
  );
}
