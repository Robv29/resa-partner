import { TriangleAlert, CarFront, Trash2, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR, formatEUR, todayISO } from "@/lib/format";
import { scheduleBooking, markDone, cancelBooking, addBookingOption } from "./actions";
import { panelClass, inputClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import SubmitButton from "@/components/ui/SubmitButton";
import AdminNewBookingForm from "./AdminNewBookingForm";
import StatusTabs from "@/components/StatusTabs";
import MarkDoneButton from "@/components/MarkDoneButton";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { requireAdmin, getScopedOrgId } from "@/lib/auth-guard";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);

  if (!orgId) {
    return (
      <div className="space-y-5">
        <PageHeader title="Planification" description="Assigne un jour et une heure à chaque véhicule déposé par les sites." />
        <div className={`${panelClass} p-8 text-center text-sm text-ink-faint`}>
          Sélectionne une organisation dans le sélecteur en haut de page pour voir sa planification.
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const status = searchParams.status || "pending";

  const today = todayISO();

  let query = supabase
    .from("bookings")
    .select(
      "id, site_id, plate, brand_model, attention_notes, status, scheduled_date, scheduled_time, created_at, site:sites(name), booking_options(option_id, option_name, price)"
    )
    .eq("organization_id", orgId)
    // Tri chronologique du plus récent au plus ancien : d'abord par jour
    // planifié (les demandes en attente, sans date, passent en dernier et se
    // trient alors par date de dépôt, la plus récente en premier).
    .order("scheduled_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const [
    { data: bookings },
    { data: siteOptions },
    { data: sites },
    { count: pendingCount },
    { count: scheduledCount },
    { count: doneCount },
    { count: allCount },
  ] = await Promise.all([
    query,
    supabase
      .from("site_options")
      .select("id, site_id, option_id, price, option:options(id, name, is_base), site:sites!inner(organization_id)")
      .eq("active", true)
      .eq("site.organization_id", orgId),
    supabase.from("sites").select("id, name").eq("active", true).eq("organization_id", orgId).order("name"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "pending"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "scheduled"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "done"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
  ]);

  // Options disponibles par site, pour proposer un ajout ciblé sur chaque
  // réservation planifiée (celles déjà appliquées à la plaque sont exclues).
  const optionsBySite = new Map<string, { option_id: string; name: string }[]>();
  // Même catalogue, mais au format attendu par le formulaire de création
  // manuelle (id de la ligne site_options, comme côté client).
  const siteOptionsForForm = new Map<
    string,
    { id: string; price: number; option: { id: string; name: string; is_base: boolean } }[]
  >();
  for (const so of siteOptions || []) {
    const optName = (so.option as any)?.name || "";
    const list = optionsBySite.get(so.site_id) || [];
    list.push({ option_id: so.option_id, name: optName });
    optionsBySite.set(so.site_id, list);

    const formList = siteOptionsForForm.get(so.site_id) || [];
    formList.push({
      id: so.id,
      price: Number(so.price),
      option: {
        id: (so.option as any)?.id || so.option_id,
        name: optName,
        is_base: !!(so.option as any)?.is_base,
      },
    });
    siteOptionsForForm.set(so.site_id, formList);
  }

  const tabs = [
    { key: "pending", label: "En attente", count: pendingCount ?? 0 },
    { key: "scheduled", label: "Planifiées", count: scheduledCount ?? 0 },
    { key: "done", label: "Terminées", count: doneCount ?? 0 },
    { key: "all", label: "Toutes", count: allCount ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Planification" description="Assigne un jour et une heure à chaque véhicule déposé par les sites." />

      <AdminNewBookingForm
        sites={sites || []}
        siteOptionsBySite={Object.fromEntries(siteOptionsForForm)}
      />

      <StatusTabs tabs={tabs} />

      <StaggerGroup className="space-y-3" staggerDelay={0.05}>
        {(bookings || []).length === 0 && (
          <div className={`${panelClass} p-8 text-center`}>
            <CarFront className="h-6 w-6 mx-auto text-ink-faint mb-2 animate-bob" strokeWidth={1.5} />
            <p className="text-sm text-ink-faint">Aucune demande dans cette catégorie.</p>
          </div>
        )}
        {(bookings || []).map((b: any) => {
          const total = (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
          const isToday = b.status === "scheduled" && b.scheduled_date === today;
          return (
            <StaggerItem
              key={b.id}
              className={`${panelClass} p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_-4px_rgba(15,23,30,0.10)] ${isToday ? "!border-2 !border-orange-400 bg-orange-50/50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink tracking-wide">{b.plate}</span>
                    <span className="text-ink-faint text-sm">— {b.site?.name}</span>
                    {isToday && (
                      <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                        Aujourd'hui
                      </span>
                    )}
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
                  <SubmitButton variant="primary" className="py-1.5" pendingText="Planification…">
                    Planifier
                  </SubmitButton>
                  <SubmitButton
                    variant="danger"
                    className="py-1.5"
                    formAction={cancelBooking}
                    formNoValidate
                    confirmMessage="Refuser cette demande ? Le site devra la redéposer si besoin d'un nouveau passage."
                  >
                    <Ban className="h-4 w-4" strokeWidth={2} />
                    Refuser
                  </SubmitButton>
                </form>
              )}

              {b.status === "scheduled" && (
                <div className="mt-3.5 border-t border-border pt-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink-soft">
                      Prévu le {formatDateFR(b.scheduled_date)} à {String(b.scheduled_time).slice(0, 5)}
                    </p>
                    <div className="flex items-center gap-4">
                      <form action={markDone}>
                        <input type="hidden" name="booking_id" value={b.id} />
                        <MarkDoneButton />
                      </form>
                      <form action={cancelBooking}>
                        <input type="hidden" name="booking_id" value={b.id} />
                        <SubmitButton
                          variant="ghost"
                          className="!px-0 !py-0 text-red-600 hover:text-red-700 hover:bg-transparent"
                          pendingText="…"
                          confirmMessage="Supprimer ce véhicule planifié ?"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                          Supprimer
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                  {(() => {
                    const applied = new Set((b.booking_options || []).map((o: any) => o.option_id));
                    const available = (optionsBySite.get(b.site_id) || []).filter((o) => !applied.has(o.option_id));
                    if (available.length === 0) return null;
                    return (
                      <form action={addBookingOption} className="flex items-end gap-2">
                        <input type="hidden" name="booking_id" value={b.id} />
                        <input type="hidden" name="site_id" value={b.site_id} />
                        <div className="flex-1">
                          <label className="block text-xs text-ink-faint mb-1">Ajouter une option (constatée sur place)</label>
                          <select name="option_id" required className={`${inputClass} py-1.5`}>
                            <option value="">— Choisir —</option>
                            {available.map((o) => (
                              <option key={o.option_id} value={o.option_id}>{o.name}</option>
                            ))}
                          </select>
                        </div>
                        <SubmitButton variant="secondary" className="py-1.5" pendingText="Ajout…">
                          Ajouter
                        </SubmitButton>
                      </form>
                    );
                  })()}
                </div>
              )}

              {b.status === "done" && (
                <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3.5">
                  <p className="text-sm text-ink-soft">
                    Terminé — était prévu le {formatDateFR(b.scheduled_date)}{" "}
                    {b.scheduled_time ? `à ${String(b.scheduled_time).slice(0, 5)}` : ""}
                  </p>
                  <form action={cancelBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <SubmitButton
                      variant="ghost"
                      className="!px-0 !py-0 text-red-600 hover:text-red-700 hover:bg-transparent"
                      pendingText="…"
                      confirmMessage="Supprimer ce véhicule terminé ? Il disparaîtra aussi de la facturation."
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                      Supprimer
                    </SubmitButton>
                  </form>
                </div>
              )}
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  );
}
