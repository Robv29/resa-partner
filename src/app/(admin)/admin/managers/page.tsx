import { createClient } from "@/lib/supabase/server";
import { inviteManager, removeManager } from "./actions";

export default async function ManagersPage() {
  const supabase = createClient();
  const { data: team } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["admin", "manager"])
    .order("role");

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-2">
        <h1 className="font-semibold text-sm text-slate-600 mb-2">Équipe interne VGS Autos</h1>
        {(team || []).map((m: any) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{m.full_name}</p>
              <p className="text-xs text-slate-400">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">{m.role}</span>
              {m.role !== "admin" && (
                <form action={removeManager}>
                  <input type="hidden" name="manager_id" value={m.id} />
                  <button className="text-xs text-red-600">Retirer</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-sm text-slate-600 mb-2">Ajouter un membre</h2>
        <form action={inviteManager} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <input name="full_name" placeholder="Nom" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          <select name="role" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button className="w-full bg-brand text-white rounded-md py-2 text-sm font-semibold">Inviter</button>
        </form>
      </div>
    </div>
  );
}
