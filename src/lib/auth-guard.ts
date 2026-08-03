import { createClient } from "@/lib/supabase/server";

// Garde-fou serveur pour les Server Actions sensibles. Le middleware protège
// déjà l'accès aux PAGES /admin/*, mais une Server Action reste un endpoint
// appelable indépendamment de la page — toute action qui touche au client
// admin (service role, qui bypasse RLS) doit revalider elle-même le rôle de
// l'appelant. Ne jamais faire confiance uniquement au middleware ici.
export async function requireRole(...allowed: Array<"admin" | "manager">) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !allowed.includes(profile.role as "admin" | "manager")) {
    throw new Error("Action réservée à l'administrateur");
  }
  return { user, role: profile.role as "admin" | "manager" };
}

export async function requireAdmin() {
  return requireRole("admin");
}
