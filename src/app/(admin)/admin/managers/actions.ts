"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, getScopedOrgId, assertProfileInOrg } from "@/lib/auth-guard";

export async function inviteManager(formData: FormData) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);
  if (!orgId) throw new Error("Sélectionne une organisation avant d'inviter un membre");

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  // Un admin ne peut créer que des managers dans sa propre organisation. La
  // création d'un compte "admin" (nouvelle organisation) passe exclusivement
  // par le lien d'inscription super_admin (/admin/organizations), qui
  // capture aussi les infos entreprise et, plus tard, le paiement Stripe.
  if (!email || !fullName) throw new Error("Email et nom requis");

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });
  if (inviteError || !invited?.user) throw new Error(inviteError?.message || "Échec de l'invitation");

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    role: "manager",
    full_name: fullName,
    email,
    site_id: null,
    organization_id: orgId,
  });
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/managers");
}

export async function removeManager(formData: FormData) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);
  const managerId = String(formData.get("manager_id"));
  // Le client service role bypasse RLS : on revérifie que ce compte
  // appartient bien à l'organisation sur laquelle l'appelant agit, sans quoi
  // n'importe quel admin pourrait supprimer le compte de n'importe qui.
  await assertProfileInOrg(managerId, orgId);
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(managerId);
  revalidatePath("/admin/managers");
}
