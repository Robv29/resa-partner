import { redirect } from "next/navigation";
import Image from "next/image";
import { CarFront } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateFR, formatEUR } from "@/lib/format";
import NewBookingForm from "./NewBookingForm";
import LogoutButton from "@/components/LogoutButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { panelClass } from "@/components/ui";

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
      <main className="max-w-lg mx-auto p-6 mt-10">
        <div className={`${panelClass} p-5 text-sm text-red-700 bg-red-50 border-red-100`}>
          Votre compte n'est rattaché à aucun site. Contactez VGS Autos pour régulariser votre accès.
        </div>
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
    <div className="min-h-screen">
      <header className="bg-ink">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white p-1">
              <Image src="/logo-mark.png" alt="Résa Partner" width={32} height={32} className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{site?.name}</p>
              <p className="text-xs text-white/50 leading-tight">Bonjour {profile.full_name}</p>
            </div>
          </div>
          <LogoutButton dark />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-5 space-y-6">
        <NewBookingForm siteOptions={sortedOptions as any} />

        <section>
          <h2 className="font-semibold text-sm text-ink-soft mb-3">
            Véhicules déposés {bookings && bookings.length > 0 && <span className="text-ink-faint">({bookings.length})</span>}
          </h2>
          <div className="space-y-2">
            {(bookings || []).length === 0 && (
              <div className={`${panelClass} p-8 text-center`}>
                <CarFront className="h-6 w-6 mx-auto text-ink-faint mb-2" strokeWidth={1.5} />
                <p className="text-sm text-ink-faint">Aucune demande pour le moment.</p>
              </div>
            )}
            {(bookings || []).map((b: any) => {
              const total = (b.booking_options || []).reduce((s: number, o: any) => s + Number(o.price), 0);
              return (
                <div key={b.id} className={`${panelClass} p-4 flex items-center justify-between gap-3`}>
                  <div className="min-w-0">
                    <span className="inline-block rounded border border-border-strong bg-black/[0.02] px-2 py-0.5 font-mono text-sm font-semibold tracking-wider text-ink">
                      {b.plate}
                    </span>
                    <p className="text-xs text-ink-faint mt-1.5 truncate">{b.brand_model || "—"}</p>
                    {(b.booking_options || []).length > 0 && (
                      <p className="text-xs text-ink-faint mt-0.5 truncate">
                        {b.booking_options.map((o: any) => o.option_name).join(", ")} · {formatEUR(total)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={b.status} />
                    {b.scheduled_date && (
                      <p className="text-xs text-ink-faint mt-1.5">
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
    </div>
  );
}
