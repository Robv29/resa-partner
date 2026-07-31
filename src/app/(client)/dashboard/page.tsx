import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR, formatEUR } from "@/lib/format";
import NewBookingForm from "./NewBookingForm";
import LogoutButton from "@/components/LogoutButton";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente de planification", color: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Planifié", color: "bg-blue-100 text-blue-700" },
  done: { label: "Terminé", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Annulé", color: "bg-slate-100 text-slate-500" },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, site_id")
    .eq("id", user.id)
    .single();

  if (!profile?.site_id) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">
          Votre compte n'est rattaché à aucun site. Contactez VGS Autos pour régulariser votre accès.
        </p>
      </main>
    );
  }

  const [{ data: site }, { data: siteOptions }, { data: bookings }] = await Promise.all([
    supabase.from("sites").select("id, name").eq("id", profile.site_id).single(),
    supabase
      .from("site_options")
      .select("id, price, option:options(id, name, is_base, sort_order)")
      .eq("site_id", profile.site_id)
      .eq("active", true)
      .order("id"),
    supabase
      .from("bookings")
      .select("id, plate, brand_model, status, scheduled_date, scheduled_time, created_at, booking_options(option_name, price)")
      .eq("site_id", profile.site_id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const sortedOptions = (siteOptions || []).slice().sort((a: any, b: any) => {
    const ao = a.option?.sort_order ?? 0;
    const bo = b.option?.sort_order ?? 0;
    return ao - bo;
  });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand">{site?.name}</h1>
          <p className="text-sm text-slate-500">Bonjour {profile.full_name}</p>
        </div>
        <LogoutButton />
      </header>

      <NewBookingForm siteOptions={sortedOptions as any} />

      <section>
        <h2 className="font-semibold text-sm text-slate-600 mb-3">Véhicules déposés</h2>
        <div className="space-y-2">
          {(bookings || []).length === 0 && (
            <p className="text-sm text-slate-400">Aucune demande pour le moment.</p>
          )}
          {(bookings || []).map((b: any) => {
            const total = (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
            const status = STATUS_LABEL[b.status] || STATUS_LABEL.pending;
            return (
              <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{b.plate}</p>
                  <p className="text-xs text-slate-500">{b.brand_model || "—"}</p>
                  {(b.booking_options || []).length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {b.booking_options.map((o: any) => o.option_name).join(", ")} · {formatEUR(total)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  {b.scheduled_date && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDateFR(b.scheduled_date)} {b.scheduled_time ? `à ${String(b.scheduled_time).slice(0, 5)}` : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
