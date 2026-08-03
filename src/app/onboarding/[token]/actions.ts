"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Page publique, sans session : on ne peut pas s'appuyer sur RLS (l'appelant
// n'est encore personne). Le client service role fait tout le travail, après
// avoir revalidé nous-mêmes que le token est valide, en attente et non expiré.
export async function completeOnboarding(formData: FormData) {
  const token = String(formData.get("token") || "");
  const companyName = String(formData.get("company_name") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const password = String(formData.get("password") || "");

  if (!token) throw new Error("Lien invalide");
  if (!companyName || !fullName) throw new Error("Entreprise et nom requis");
  if (password.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères");

  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("admin_invites")
    .select("*")
    .eq("token", token)
    .single();
  if (inviteError || !invite) {
    redirect(`/onboarding/${token}?error=${encodeURIComponent("Lien invalide ou déjà utilisé.")}`);
  }
  if (invite!.status === "completed") {
    redirect(`/onboarding/${token}?error=${encodeURIComponent("Ce lien a déjà été utilisé pour créer un compte.")}`);
  }
  if (invite!.status !== "pending" || new Date(invite!.expires_at) < new Date()) {
    redirect(`/onboarding/${token}?error=${encodeURIComponent("Ce lien a expiré. Demande un nouveau lien à Résa Partner.")}`);
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: companyName, status: "active" })
    .select("id")
    .single();
  if (orgError || !org) throw new Error(orgError?.message || "Erreur création organisation");

  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: invite!.email,
    password,
    email_confirm: true,
  });
  if (userError || !created?.user) throw new Error(userError?.message || "Erreur création du compte");

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    role: "admin",
    full_name: fullName,
    email: invite!.email,
    site_id: null,
    organization_id: org.id,
  });
  if (profileError) throw new Error(profileError.message);

  await admin
    .from("admin_invites")
    .update({ status: "completed", organization_id: org.id, completed_at: new Date().toISOString() })
    .eq("id", invite!.id);

  // Connecte immédiatement le nouvel admin (établit la session via cookies)
  // pour l'envoyer directement sur sa console plutôt que sur /login.
  const supabase = createClient();
  await supabase.auth.signInWithPassword({ email: invite!.email, password });

  redirect("/admin");
}
