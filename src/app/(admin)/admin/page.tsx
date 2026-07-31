import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR } from "@/lib/format";

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Sites actifs</p>
          <p className="text-2xl font-bold text-brand">{siteCount ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">En attente de planification</p>
          <p className="text-2xl font-bold text-amber-600">{pending?.length ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Planifiées (à venir)</p>
          <p className="text-2xl font-bold text-blue-600">{scheduledSoon ?? 0}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-sm">Demandes à planifier en priorité</h2>
          <Link href="/admin/bookings" className="text-sm text-brand-accent hover:underline">
            Tout voir →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {(pending || []).length === 0 && (
            <p className="p-4 text-sm text-slate-400">Rien en attente, tout est planifié.</p>
          )}
          {(pending || []).map((b: any) => (
            <div key={b.id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold">{b.plate}</span>{" "}
                <span className="text-slate-400">— {b.site?.name}</span>
                <p className="text-xs text-slate-400">{b.brand_model || "—"}</p>
              </div>
              <span className="text-xs text-slate-400">déposé le {formatDateFR(b.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
