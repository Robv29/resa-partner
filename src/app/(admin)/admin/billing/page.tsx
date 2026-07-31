import { createClient } from "@/lib/supabase/server";
import { formatEUR, lastMonths, monthRange } from "@/lib/format";
import BillingFilters from "./BillingFilters";
import CopyPlatesButton from "./CopyPlatesButton";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { site?: string; month?: string };
}) {
  const supabase = createClient();
  const { data: sites } = await supabase.from("sites").select("id, name").order("name");

  const months = lastMonths(12);
  const currentMonth = searchParams.month || months[0].value;
  const currentSite = searchParams.site || sites?.[0]?.id || "";

  if (!currentSite) {
    return <p className="text-sm text-slate-400">Créez d'abord un site pour accéder à la facturation.</p>;
  }

  const { start, end } = monthRange(currentMonth);

  // Facturable = prestations planifiées ou terminées dans le mois (on exclut
  // les demandes annulées et celles encore en attente de planification).
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, plate, scheduled_date, status, booking_options(option_name, price)")
    .eq("site_id", currentSite)
    .gte("scheduled_date", start)
    .lt("scheduled_date", end)
    .in("status", ["scheduled", "done"]);

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
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-sm text-slate-600">Facturation — {siteName}</h1>
        <BillingFilters sites={sites || []} months={months} currentSite={currentSite} currentMonth={currentMonth} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total à facturer sur la période</span>
        <span className="text-2xl font-bold text-brand">{formatEUR(grandTotal)}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="py-3 px-4">Option</th>
              <th className="py-3 px-4">Nb véhicules</th>
              <th className="py-3 px-4">Sous-total</th>
              <th className="py-3 px-4">Plaques concernées</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([optionName, g]) => (
              <tr key={optionName} className="border-b border-slate-50 align-top">
                <td className="py-3 px-4 font-medium">{optionName}</td>
                <td className="py-3 px-4">{g.plates.size}</td>
                <td className="py-3 px-4 font-semibold">{formatEUR(g.total)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{Array.from(g.plates).join(", ")}</span>
                    <CopyPlatesButton plates={Array.from(g.plates)} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                  Aucune prestation facturable sur cette période.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
