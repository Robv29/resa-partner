"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, getScopedOrgId, assertSiteInOrg } from "@/lib/auth-guard";

export async function createSite(formData: FormData) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);
  if (!orgId) throw new Error("Sélectionne une organisation avant de créer un site");
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  if (!name) throw new Error("Nom du site requis");

  const { data, error } = await supabase
    .from("sites")
    .insert({ name, address: address || null, organization_id: orgId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sites");
  redirect(`/admin/sites/${data.id}`);
}

export async function updateSite(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const siteId = String(formData.get("site_id"));
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const active = formData.get("active") === "on";
  const reminderDay = Number(formData.get("reminder_day") || 5);

  const { error } = await supabase
    .from("sites")
    .update({
      name,
      address: address || null,
      active,
      reminder_day: reminderDay >= 1 && reminderDay <= 7 ? reminderDay : 5,
    })
    .eq("id", siteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/sites/${siteId}`);
}

// Un site peut avoir plusieurs référents (admin ou manager) qui reçoivent
// les notifications de nouvelles plaques à planifier — remplace l'ancien
// "manager référent" unique. On repart de zéro à chaque enregistrement :
// plus simple et sans risque d'incohérence qu'un diff ligne à ligne.
export async function updateSiteReferents(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const siteId = String(formData.get("site_id"));
  const referentIds = formData.getAll("referent_id").map(String).filter(Boolean);

  const { error: deleteError } = await supabase.from("site_referents").delete().eq("site_id", siteId);
  if (deleteError) throw new Error(deleteError.message);

  if (referentIds.length > 0) {
    const { error: insertError } = await supabase
      .from("site_referents")
      .insert(referentIds.map((profileId) => ({ site_id: siteId, profile_id: profileId })));
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/admin/sites/${siteId}`);
}

// Crée une nouvelle option dans le catalogue global (visible ensuite pour
// tous les sites, à activer/tarifer site par site) directement depuis la
// fiche site, sans repasser par un autre écran.
export async function createOption(formData: FormData) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);
  if (!orgId) throw new Error("Sélectionne une organisation");
  const supabase = createClient();
  const siteId = String(formData.get("site_id"));
  const name = String(formData.get("new_option_name") || "").trim();
  const price = Number(formData.get("new_option_price") || 0);
  if (!name) throw new Error("Nom de l'option requis");

  const { data: option, error } = await supabase
    .from("options")
    .insert({ name, organization_id: orgId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Active directement l'option sur ce site avec le prix indiqué, pour
  // éviter un aller-retour supplémentaire.
  const { error: siteOptionError } = await supabase
    .from("site_options")
    .insert({ site_id: siteId, option_id: option.id, price, active: true });
  if (siteOptionError) throw new Error(siteOptionError.message);

  revalidatePath(`/admin/sites/${siteId}`);
}

// Ajoute une option du catalogue au site avec un prix (upsert)
export async function upsertSiteOption(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const siteId = String(formData.get("site_id"));
  const optionId = String(formData.get("option_id"));
  const price = Number(formData.get("price"));

  const { error } = await supabase
    .from("site_options")
    .upsert({ site_id: siteId, option_id: optionId, price, active: true }, { onConflict: "site_id,option_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function toggleSiteOption(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const siteOptionId = String(formData.get("site_option_id"));
  const siteId = String(formData.get("site_id"));
  const active = String(formData.get("active")) === "true";

  const { error } = await supabase.from("site_options").update({ active: !active }).eq("id", siteOptionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/sites/${siteId}`);
}

// Invite un contact client rattaché à ce site (passe par /api/invite)
export async function inviteContact(formData: FormData) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);
  const siteId = String(formData.get("site_id"));
  // Le client service role bypasse RLS : on revérifie nous-mêmes que ce site
  // appartient bien à l'organisation sur laquelle l'appelant agit.
  await assertSiteInOrg(siteId, orgId);
  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  if (!email || !fullName) throw new Error("Email et nom requis");

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });
  if (inviteError || !invited?.user) throw new Error(inviteError?.message || "Échec de l'invitation");

  const { data: site } = await admin.from("sites").select("organization_id").eq("id", siteId).single();

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    role: "client",
    full_name: fullName,
    email,
    site_id: siteId,
    organization_id: site?.organization_id ?? orgId,
  });
  if (profileError) throw new Error(profileError.message);

  revalidatePath(`/admin/sites/${siteId}`);
}

export async function removeContact(formData: FormData) {
  const auth = await requireAdmin();
  const orgId = await getScopedOrgId(auth);
  const siteId = String(formData.get("site_id"));
  const contactId = String(formData.get("contact_id"));
  await assertSiteInOrg(siteId, orgId);

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(contactId);
  revalidatePath(`/admin/sites/${siteId}`);
}
