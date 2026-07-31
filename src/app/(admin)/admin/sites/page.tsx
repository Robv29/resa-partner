import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSite } from "./actions";

export default async function AdminSitesPage() {
  const supabase = createClient();
  const { data: sites } = await supabase.from("sites").select("id, name, address, active").order("name");

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-2">
        <h1 className="font-semibold text-sm text-slate-600 mb-2">Sites clients</h1>
        {(sites || []).map((s) => (
          <Link
            key={s.id}
            href={`/admin/sites/${s.id}`}
            className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-accent"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{s.name}</span>
              {!s.active && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactif</span>}
            </div>
            {s.address && <p className="text-xs text-slate-400">{s.address}</p>}
          </Link>
        ))}
        {(sites || []).length === 0 && <p className="text-sm text-slate-400">Aucun site pour le moment.</p>}
      </div>

      <div>
        <h2 className="font-semibold text-sm text-slate-600 mb-2">Nouveau site</h2>
        <form action={createSite} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Nom de la concession</label>
            <input name="name" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Adresse</label>
            <input name="address" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <button className="w-full bg-brand text-white rounded-md py-2 text-sm font-semibold">Créer</button>
        </form>
      </div>
    </div>
  );
}
