import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createSite } from "./actions";
import { panelClass, inputClass, labelClass, buttonClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export default async function AdminSitesPage() {
  const supabase = createClient();
  const { data: sites } = await supabase.from("sites").select("id, name, address, active").order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Sites clients" description="Concessions rattachées, contacts et tarifs par option." />

      <div className="grid grid-cols-3 gap-6">
        <StaggerGroup className="col-span-2 space-y-2" staggerDelay={0.05}>
          {(sites || []).map((s) => (
            <StaggerItem key={s.id}>
              <Link
                href={`/admin/sites/${s.id}`}
                className={`${panelClass} flex items-center justify-between p-4 transition-[transform,box-shadow,border-color] duration-200 hover:border-border-strong hover:-translate-y-[1px] hover:shadow-[0_4px_16px_-4px_rgba(15,23,30,0.10)] group`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-black/[0.03] text-ink-soft transition-colors group-hover:bg-gold-soft group-hover:text-gold-ink">
                    <Building2 className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{s.name}</span>
                      {!s.active && (
                        <span className="text-xs bg-black/[0.04] text-ink-faint px-2 py-0.5 rounded-full">Inactif</span>
                      )}
                    </div>
                    {s.address && <p className="text-xs text-ink-faint">{s.address}</p>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-faint transition-transform group-hover:text-ink-soft group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
            </StaggerItem>
          ))}
          {(sites || []).length === 0 && (
            <div className={`${panelClass} p-8 text-center`}>
              <p className="text-sm text-ink-faint">Aucun site pour le moment.</p>
            </div>
          )}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <h2 className="font-medium text-sm text-ink-soft mb-2">Nouveau site</h2>
          <form action={createSite} className={`${panelClass} p-4 space-y-3`}>
            <div>
              <label className={labelClass}>Nom de la concession</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Adresse</label>
              <input name="address" className={inputClass} />
            </div>
            <button className={buttonClass("primary", "w-full")}>Créer</button>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
