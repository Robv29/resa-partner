import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  updateSite,
  upsertSiteOption,
  toggleSiteOption,
  inviteContact,
  removeContact,
  createOption,
} from "../actions";
import { panelClass, inputClass, labelClass, buttonClass } from "@/components/ui";
import SubmitButton from "@/components/ui/SubmitButton";
import { WEEKDAY_LABELS } from "@/lib/format";

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

  if (!site) return <p className="text-ink-soft">Site introuvable.</p>;

  const siteOptionByOptionId = new Map((siteOptions || []).map((so: any) => [so.option_id, so]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/sites" className="flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink-soft mb-2">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Sites
        </Link>
        <h1 className="text-xl font-semibold text-ink tracking-[-0.01em]">{site.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Infos site */}
        <form action={updateSite} className={`${panelClass} p-5 space-y-3`}>
          <input type="hidden" name="site_id" value={site.id} />
          <h2 className="font-medium text-sm text-ink-soft">Informations</h2>
          <div>
            <label className={labelClass}>Nom</label>
            <input name="name" defaultValue={site.name} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Adresse</label>
            <input name="address" defaultValue={site.address || ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Manager référent (reçoit les notifs)</label>
            <select name="manager_id" defaultValue={site.manager_id || ""} className={inputClass}>
              <option value="">— Aucun —</option>
              {(managers || []).map((m: any) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Jour d'envoi du rappel hebdomadaire</label>
            <select name="reminder_day" defaultValue={site.reminder_day ?? 5} className={inputClass}>
              {WEEKDAY_LABELS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <p className="text-xs text-ink-faint mt-1">
              Email automatique envoyé aux contacts de ce site pour leur rappeler de renseigner les plaques de la
              semaine prochaine. À prévoir au moins 3 jours avant le passage : une plaque déposée trop tard peut être
              refusée depuis la planification.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="active" defaultChecked={site.active} className="accent-accent h-4 w-4" />
            Site actif
          </label>
          <SubmitButton variant="primary" pendingText="Enregistrement…">Enregistrer</SubmitButton>
        </form>

        {/* Contacts */}
        <div className={`${panelClass} p-5 space-y-3`}>
          <h2 className="font-medium text-sm text-ink-soft">Contacts rattachés</h2>
          <div className="space-y-2">
            {(contacts || []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.04] text-ink-faint">
                    <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{c.full_name}</p>
                    <p className="text-xs text-ink-faint">{c.email}</p>
                  </div>
                </div>
                <form action={removeContact}>
                  <input type="hidden" name="site_id" value={siteId} />
                  <input type="hidden" name="contact_id" value={c.id} />
                  <SubmitButton
                    variant="ghost"
                    className="!px-0 !py-0 text-xs text-red-600 hover:text-red-700 hover:bg-transparent"
                    pendingText="…"
                    confirmMessage={`Retirer l'accès de ${c.full_name} ? Son compte sera supprimé.`}
                  >
                    Retirer
                  </SubmitButton>
                </form>
              </div>
            ))}
            {(contacts || []).length === 0 && <p className="text-xs text-ink-faint">Aucun contact pour le moment.</p>}
          </div>
          <form action={inviteContact} className="border-t border-border pt-3 space-y-2">
            <input type="hidden" name="site_id" value={siteId} />
            <input name="full_name" placeholder="Nom du contact" required className={inputClass} />
            <input name="email" type="email" placeholder="Email" required className={inputClass} />
            <SubmitButton variant="secondary" className="w-full" pendingText="Envoi de l'invitation…">
              Inviter (envoi email de création de compte)
            </SubmitButton>
          </form>
        </div>
      </div>

      {/* Options & prix */}
      <div className={panelClass}>
        <h2 className="font-medium text-sm text-ink-soft px-5 pt-5">Options disponibles & prix</h2>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-xs text-ink-faint border-b border-border">
              <th className="py-2 px-5 font-medium">Option</th>
              <th className="py-2 px-2 w-44 font-medium">Prix (€)</th>
              <th className="py-2 px-5 w-32 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(options || []).map((opt: any) => {
              const so = siteOptionByOptionId.get(opt.id);
              return (
                <tr key={opt.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 px-5 text-ink">
                    {opt.name}
                    {opt.is_base && <span className="text-xs text-ink-faint ml-1">(base)</span>}
                  </td>
                  <td className="py-2.5 px-2">
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
                        className={`${inputClass} w-24 py-1.5`}
                      />
                      <SubmitButton
                        variant="ghost"
                        className="!px-0 !py-0 text-xs text-accent-ink font-medium hover:underline hover:bg-transparent"
                        pendingText="…"
                      >
                        {so ? "Mettre à jour" : "Activer"}
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="py-2.5 px-5">
                    {so ? (
                      <form action={toggleSiteOption}>
                        <input type="hidden" name="site_option_id" value={so.id} />
                        <input type="hidden" name="site_id" value={siteId} />
                        <input type="hidden" name="active" value={String(so.active)} />
                        <button
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            so.active ? "bg-emerald-50 text-emerald-800" : "bg-black/[0.04] text-ink-faint"
                          }`}
                        >
                          {so.active ? "Active" : "Désactivée"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <form action={createOption} className="flex items-end gap-2 px-5 py-4 border-t border-border">
          <input type="hidden" name="site_id" value={siteId} />
          <div className="flex-1">
            <label className={labelClass}>Nouvelle option</label>
            <input name="new_option_name" placeholder="Ex: Nettoyage moteur" required className={inputClass} />
          </div>
          <div className="w-28">
            <label className={labelClass}>Prix (€)</label>
            <input type="number" step="0.01" min="0" name="new_option_price" placeholder="0.00" className={inputClass} />
          </div>
          <SubmitButton variant="secondary" pendingText="Création…">Créer et activer ici</SubmitButton>
        </form>
        <p className="text-xs text-ink-faint px-5 py-4">
          Le tarif de chaque option est propre à ce site et n'affecte aucun autre site. Une option créée ici rejoint
          le catalogue global : tu pourras l'activer et lui donner un autre prix sur les autres sites depuis leur
          propre fiche.
        </p>
      </div>
    </div>
  );
}
