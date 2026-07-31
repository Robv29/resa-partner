import { TriangleAlert, CheckCheck, CarFront } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR, formatEUR } from "@/lib/format";
import { scheduleBooking, markDone, cancelBooking } from "./actions";
import { panelClass, inputClass, buttonClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const status = searchParams.status || "pending";

  let query = supabase
    .from("bookings")
    .select(
      "id, plate, brand_model, attention_notes, status, scheduled_date, scheduled_time, created_at, site:sites(name), booking_options(option_name, price)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data: bookings } = await query;

  const tabs = [
    { key: "pending", label: "En attente" },
    { key: "scheduled", label: "Planifiées" },
    { key: "done", label: "Terminées" },
    { key: "all", label: "Toutes" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Planification" description="Assigne un jour et une heure à chaque véhicule déposé par les sites." />

      <div className="flex gap-1.5">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/bookings?status=${t.key}`}
            className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
              status === t.key
                ? "bg-ink text-white border-ink"
                : "bg-surface border-border text-ink-soft hover:border-border-strong"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {(bookings || []).length === 0 && (
          <div className={`${panelClass} p-8 text-center`}>
            <CarFront className="h-6 w-6 mx-auto text-ink-faint mb-2" strokeWidth={1.5} />
            <p className="text-sm text-ink-faint">Aucune demande dans cette catégorie.</p>
          </div>
        )}
        {(bookings || []).map((b: any) => {
          const total = (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
          return (
            <div key={b.id} className={`${panelClass} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink tracking-wide">{b.plate}</span>
                    <span className="text-ink-faint text-sm">— {b.site?.name}</span>
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5">{b.brand_model || "—"}</p>
                  {b.attention_notes && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-800 mt-1.5">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                      {b.attention_notes}
                    </p>
                  )}
                  {(b.booking_options || []).length > 0 && (
                    <p className="text-xs text-ink-faint mt-1.5">
                      {b.booking_options.map((o: any) => o.option_name).join(", ")} · {formatEUR(total)}
                    </p>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>

              {b.status === "pending" && (
                <form action={scheduleBooking} className="mt-3.5 flex items-end gap-2 border-t border-border pt-3.5">
                  <input type="hidden" name="booking_id" value={b.id} />
                  <div>
                    <label className="block text-xs text-ink-faint mb-1">Jour</label>
                    <input type="date" name="scheduled_date" required className={`${inputClass} py-1.5`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-faint mb-1">Heure</label>
                    <input type="time" name="scheduled_time" required className={`${inputClass} py-1.5`} />
                  </div>
                  <button className={buttonClass("primary", "py-1.5")}>Planifier</button>
                  <button formAction={cancelBooking} formNoValidate className={buttonClass("danger", "py-1.5")}>
                    Annuler
                  </button>
                </form>
              )}

              {b.status === "scheduled" && (
                <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3.5">
                  <p className="text-sm text-ink-soft">
                    Prévu le {formatDateFR(b.scheduled_date)} à {String(b.scheduled_time).slice(0, 5)}
                  </p>
                  <form action={markDone}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium hover:text-emerald-800">
                      <CheckCheck className="h-4 w-4" strokeWidth={2} />
                      Marquer terminé
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
