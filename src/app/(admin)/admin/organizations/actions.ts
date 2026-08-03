"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin, requireAdmin, VIEWING_ORG_COOKIE } from "@/lib/auth-guard";

// Change l'organisation "visée" par le sélecteur du header (super_admin
// uniquement). "__all__" = vue globale toutes organisations confondues.
export async function switchViewingOrg(formData: FormData) {
  await requireAdmin(); // n'importe quel admin/super_admin peut appeler ça sans risque : le cookie n'a d'effet que pour un super_admin (voir getScopedOrgId)
  const orgId = String(formData.get("org_id") || "");
  cookies().set(VIEWING_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  const redirectTo = String(formData.get("redirect_to") || "/admin");
  revalidatePath("/admin", "layout");
  redirect(redirectTo);
}

// Génère un lien d'inscription à usage unique pour un futur admin. Il n'a
// besoin que de son email pour l'instant : c'est LUI qui renseigne son
// entreprise (et plus tard son paiement Stripe) en remplissant la page
// publique /onboarding/[token] — Robin ne crée rien à sa place.
export async function createAdminInvite(formData: FormData) {
  const auth = await requireSuperAdmin();
  const supabase = createClient();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const companyName = String(formData.get("company_name") || "").trim();
  if (!email) throw new Error("Email requis");

  const token = randomBytes(24).toString("hex");

  const { error } = await supabase.from("admin_invites").insert({
    email,
    company_name: companyName || null,
    token,
    created_by: auth.user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/organizations");
  redirect(`/admin/organizations?invite_token=${token}`);
}

export async function revokeAdminInvite(formData: FormData) {
  await requireSuperAdmin();
  const supabase = createClient();
  const inviteId = String(formData.get("invite_id"));
  const { error } = await supabase.from("admin_invites").update({ status: "expired" }).eq("id", inviteId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/organizations");
}

// Suspend/réactive une organisation manuellement (en attendant le webhook
// Stripe de la phase 2, qui fera ça automatiquement sur échec de paiement).
export async function toggleOrganizationStatus(formData: FormData) {
  await requireSuperAdmin();
  const supabase = createClient();
  const orgId = String(formData.get("organization_id"));
  const currentStatus = String(formData.get("current_status"));
  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";

  const { error } = await supabase.from("organizations").update({ status: nextStatus }).eq("id", orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/organizations");
}
