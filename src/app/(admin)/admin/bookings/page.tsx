import { createClient } from "@/lib/supabase/server";
import { formatDateFR, formatEUR } from "@/lib/format";
import { scheduleBooking, markDone, cancelBooking } from "./actions";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Planifié", color: "bg-blue-100 text-blue-700" },
  done: { label: "Terminé", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Annulé", color: "bg-slate-100 text-slate-500" },
};

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
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/bookings?status=${t.key}`}
            className={`text-sm px-3 py-1.5 rounded-md border ${
              status === t.key ? "bg-brand text-white border-brand" : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {(bookings || []).length === 0 && (
          <p className="text-sm text-slate-400">Aucune demande dans cette catégorie.</p>
        )}
        {(bookings || []).map((b: any) => {
          const total = (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
          const st = STATUS_LABEL[b.status] || STATUS_LABEL.pending;
          return (
            <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {b.plate} <span className="text-slate-400 font-normal">— {b.site?.name}</span>
                  </p>
                  <p className="text-xs text-slate-500">{b.brand_model || "—"}</p>
                  {b.attention_notes && <p className="text-xs text-amber-700 mt-1">⚠ {b.attention_notes}</p>}
                  {(b.booking_options || []).length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {b.booking_options.map((o: any) => o.option_name).join(", ")} · {formatEUR(total)}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>

              {b.status === "pending" && (
                <form action={scheduleBooking} className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3">
                  <input type="hidden" name="booking_id" value={b.id} />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Jour</label>
                    <input type="date" name="scheduled_date" required className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Heure</label>
                    <input type="time" name="scheduled_time" required className="border border-slate-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                  <button className="bg-brand text-white text-sm px-3 py-1.5 rounded-md font-semibold">
                    Planifier
                  </button>
                  <button formAction={cancelBooking} formNoValidate className="text-sm text-red-600 px-2 py-1.5">
                    Annuler
                  </button>
                </form>
              )}

              {b.status === "scheduled" && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-sm text-slate-600">
                    Prévu le {formatDateFR(b.scheduled_date)} à {String(b.scheduled_time).slice(0, 5)}
                  </p>
                  <form action={markDone}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button className="text-sm text-emerald-700 font-semibold">Marquer terminé</button>
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
