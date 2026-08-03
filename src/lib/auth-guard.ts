import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "super_admin" | "admin" | "manager";

// Cookie posé par le sélecteur "Agir en tant que" (super_admin uniquement) —
// détermine quelle organisation il est en train de consulter/gérer.
export const VIEWING_ORG_COOKIE = "viewing_org_id";

// Garde-fou serveur pour les Server Actions sensibles. Le middleware protège
// déjà l'accès aux PAGES /admin/*, mais une Server Action reste un endpoint
// appelable indépendamment de la page — toute action qui touche au client
// admin (service role, qui bypasse RLS) doit revalider elle-même le rôle de
// l'appelant. Ne jamais faire confiance uniquement au middleware ici.
export async function requireRole(...allowed: AdminRole[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!profile || !allowed.includes(profile.role as AdminRole)) {
    throw new Error("Action réservée à l'administrateur");
  }
  return { user, role: profile.role as AdminRole, organizationId: profile.organization_id as string | null };
}

// Accès à la console d'administration : admin (propriétaire d'une
// organisation) ou super_admin (Résa Partner, tous comptes).
export async function requireAdmin() {
  return requireRole("admin", "super_admin");
}

// Réservé au super_admin : création d'organisations/admins, vue globale.
export async function requireSuperAdmin() {
  return requireRole("super_admin");
}

type Auth = { role: AdminRole; organizationId: string | null };

// Organisation sur laquelle l'appelant agit réellement :
// - admin/manager : toujours la leur (organization_id de leur profil, non
//   contournable — le cookie est ignoré pour ces rôles).
// - super_admin : l'organisation actuellement sélectionnée via le switcher
//   ("Agir en tant que" dans le header), ou sa propre organisation par
//   défaut si rien n'est sélectionné, ou null ("toutes les organisations").
export async function getScopedOrgId(auth: Auth): Promise<string | null> {
  if (auth.role !== "super_admin") return auth.organizationId;
  const viewing = cookies().get(VIEWING_ORG_COOKIE)?.value;
  if (viewing === "__all__") return null;
  return viewing || auth.organizationId;
}

// Vérifications explicites pour les Server Actions qui utilisent le client
// service role (createAdminClient) — celui-ci bypass RLS, donc la RLS ne
// protège plus rien : il faut revérifier ici que la ressource ciblée
// appartient bien à l'organisation sur laquelle l'appelant agit.
export async function assertSiteInOrg(siteId: string, orgId: string | null) {
  if (orgId === null) return; // super_admin en vue "toutes les organisations" : pas de restriction
  const supabase = createClient();
  const { data: site } = await supabase.from("sites").select("organization_id").eq("id", siteId).single();
  if (!site || site.organization_id !== orgId) {
    throw new Error("Ce site n'appartient pas à ton organisation");
  }
}

export async function assertProfileInOrg(profileId: string, orgId: string | null) {
  if (orgId === null) return;
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", profileId).single();
  if (!profile || profile.organization_id !== orgId) {
    throw new Error("Ce compte n'appartient pas à ton organisation");
  }
}
