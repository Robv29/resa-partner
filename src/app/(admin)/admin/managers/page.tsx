import { UserRound, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { inviteManager, removeManager } from "./actions";
import { panelClass, inputClass, buttonClass } from "@/components/ui";
import PageHeader from "@/components/ui/PageHeader";

export default async function ManagersPage() {
  const supabase = createClient();
  const { data: team } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["admin", "manager"])
    .order("role");

  return (
    <div className="space-y-6">
      <PageHeader title="Équipe interne" description="Managers et admins qui reçoivent les notifications de planification." />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-2">
          {(team || []).map((m: any) => (
            <div key={m.id} className={`${panelClass} flex items-center justify-between p-4`}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-ink-soft">
                  {m.role === "admin" ? (
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <UserRound className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
                <div>
                  <p className="font-medium text-ink">{m.full_name}</p>
                  <p className="text-xs text-ink-faint">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full bg-black/[0.04] text-ink-soft capitalize">{m.role}</span>
                {m.role !== "admin" && (
                  <form action={removeManager}>
                    <input type="hidden" name="manager_id" value={m.id} />
                    <button className="text-xs text-red-600 hover:text-red-700">Retirer</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-medium text-sm text-ink-soft mb-2">Ajouter un membre</h2>
          <form action={inviteManager} className={`${panelClass} p-4 space-y-3`}>
            <input name="full_name" placeholder="Nom" required className={inputClass} />
            <input name="email" type="email" placeholder="Email" required className={inputClass} />
            <select name="role" className={inputClass}>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button className={buttonClass("primary", "w-full")}>Inviter</button>
          </form>
        </div>
      </div>
    </div>
  );
}
