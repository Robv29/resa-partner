"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-guard";

export async function inviteManager(formData: FormData) {
  // Réservé à l'admin : cette action peut créer un compte "admin" pour
  // quelqu'un d'autre, donc ne jamais l'ouvrir aux managers.
  await requireAdmin();

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "manager") as "manager" | "admin";
  if (!email || !fullName) throw new Error("Email et nom requis");

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });
  if (inviteError || !invited?.user) throw new Error(inviteError?.message || "Échec de l'invitation");

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    role,
    full_name: fullName,
    email,
    site_id: null,
  });
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/managers");
}

export async function removeManager(formData: FormData) {
  await requireAdmin();
  const managerId = String(formData.get("manager_id"));
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(managerId);
  revalidatePath("/admin/managers");
}
