import Link from "next/link";
import { Building2, CircleDashed, CalendarClock, ArrowRight, CarFront } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR } from "@/lib/format";
import { panelClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";

export default async function AdminOverview() {
  const supabase = createClient();

  const [{ count: siteCount }, { data: pending }, { count: scheduledSoon }] = await Promise.all([
    supabase.from("sites").select("*", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("bookings")
      .select("id, plate, brand_model, created_at, site:sites(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
  ]);

  const stats = [
    { label: "Sites actifs", value: siteCount ?? 0, Icon: Building2, tone: "text-ink" },
    { label: "En attente de planification", value: pending?.length ?? 0, Icon: CircleDashed, tone: "text-amber-600" },
    { label: "Planifiées (à venir)", value: scheduledSoon ?? 0, Icon: CalendarClock, tone: "text-accent-ink" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Vue d'ensemble" description="État du parc de véhicules à traiter, tous sites confondus." />

      <div className={`${panelClass} grid grid-cols-3 divide-x divide-border`}>
        {stats.map((s) => (
          <div key={s.label} className="p-5">
            <s.Icon className={`h-4 w-4 mb-3 ${s.tone}`} strokeWidth={2} />
            <p className={`text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="text-xs text-ink-faint mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-sm text-ink">Demandes à planifier en priorité</h2>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-sm text-accent-ink hover:underline">
            Tout voir <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {(pending || []).length === 0 && (
            <div className="p-8 text-center">
              <CarFront className="h-6 w-6 mx-auto text-ink-faint mb-2" strokeWidth={1.5} />
              <p className="text-sm text-ink-faint">Rien en attente, tout est planifié.</p>
            </div>
          )}
          {(pending || []).map((b: any) => (
            <div key={b.id} className="px-5 py-3.5 flex items-center justify-between text-sm">
              <div>
                <span className="font-mono font-semibold text-ink tracking-wide">{b.plate}</span>{" "}
                <span className="text-ink-faint">— {b.site?.name}</span>
                <p className="text-xs text-ink-faint mt-0.5">{b.brand_model || "—"}</p>
              </div>
              <span className="text-xs text-ink-faint">déposé le {formatDateFR(b.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
