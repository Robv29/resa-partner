import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/format";
import {
  updateSite,
  upsertSiteOption,
  toggleSiteOption,
  inviteContact,
  removeContact,
} from "../actions";

export default async function SiteDetailPage({ params }: { params: { siteId: string } }) {
  const supabase = createClient();
  const siteId = params.siteId;

  const [{ data: site }, { data: managers }, { data: contacts }, { data: options }, { data: siteOptions }] =
    await Promise.all([
      supabase.from("sites").select("*").eq("id", siteId).single(),
      supabase.from("profiles").select("id, full_name").eq("role", "manager"),
      supabase.from("profiles").select("id, full_name, email").eq("site_id", siteId).eq("role", "client"),
      supabase.from("options").select("*").eq("archived", false).order("sort_order"),
      supabase.from("site_options").select("*").eq("site_id", siteId),
    ]);

  if (!site) return <p>Site introuvable.</p>;

  const siteOptionByOptionId = new Map((siteOptions || []).map((so: any) => [so.option_id, so]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Infos site */}
        <form action={updateSite} className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <input type="hidden" name="site_id" value={site.id} />
          <h2 className="font-semibold text-sm text-slate-600">Informations</h2>
          <div>
            <label className="block text-xs font-medium mb-1">Nom</label>
            <input name="name" defaultValue={site.name} required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Adresse</label>
            <input name="address" defaultValue={site.address || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Manager référent (reçoit les notifs)</label>
            <select name="manager_id" defaultValue={site.manager_id || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="">— Aucun —</option>
              {(managers || []).map((m: any) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={site.active} /> Site actif
          </label>
          <button className="bg-brand text-white rounded-md px-4 py-2 text-sm font-semibold">Enregistrer</button>
        </form>

        {/* Contacts */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <h2 className="font-semibold text-sm text-slate-600">Contacts rattachés</h2>
          <div className="space-y-2">
            {(contacts || []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2">
                <div>
                  <p className="font-medium">{c.full_name}</p>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
                <form action={removeContact}>
                  <input type="hidden" name="site_id" value={siteId} />
                  <input type="hidden" name="contact_id" value={c.id} />
                  <button className="text-xs text-red-600">Retirer</button>
                </form>
              </div>
            ))}
            {(contacts || []).length === 0 && <p className="text-xs text-slate-400">Aucun contact pour le moment.</p>}
          </div>
          <form action={inviteContact} className="border-t border-slate-100 pt-3 space-y-2">
            <input type="hidden" name="site_id" value={siteId} />
            <input name="full_name" placeholder="Nom du contact" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
            <button className="w-full bg-brand text-white rounded-md py-2 text-sm font-semibold">
              Inviter (envoi email de création de compte)
            </button>
          </form>
        </div>
      </div>

      {/* Options & prix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="font-semibold text-sm text-slate-600 mb-3">Options disponibles & prix — {site.name}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="py-2">Option</th>
              <th className="py-2 w-40">Prix (€)</th>
              <th className="py-2 w-32">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(options || []).map((opt: any) => {
              const so = siteOptionByOptionId.get(opt.id);
              return (
                <tr key={opt.id} className="border-b border-slate-50">
                  <td className="py-2">
                    {opt.name}
                    {opt.is_base && <span className="text-xs text-slate-400 ml-1">(base)</span>}
                  </td>
                  <td className="py-2">
                    <form action={upsertSiteOption} className="flex items-center gap-2">
                      <input type="hidden" name="site_id" value={siteId} />
                      <input type="hidden" name="option_id" value={opt.id} />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        defaultValue={so ? Number(so.price) : ""}
                        placeholder="0.00"
                        className="w-24 border border-slate-300 rounded-md px-2 py-1 text-sm"
                      />
                      <button className="text-xs text-brand-accent font-semibold">
                        {so ? "Mettre à jour" : "Activer"}
                      </button>
                    </form>
                  </td>
                  <td className="py-2">
                    {so ? (
                      <form action={toggleSiteOption}>
                        <input type="hidden" name="site_option_id" value={so.id} />
                        <input type="hidden" name="site_id" value={siteId} />
                        <input type="hidden" name="active" value={String(so.active)} />
                        <button className={`text-xs px-2 py-1 rounded-full ${so.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {so.active ? "Active" : "Désactivée"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">
          Prix affiché = {formatEUR(0)} par défaut. Le tarif est spécifique à ce site et n'affecte pas les autres sites.
        </p>
      </div>
    </div>
  );
}
