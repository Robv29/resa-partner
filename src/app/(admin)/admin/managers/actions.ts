"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteManager(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

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
  const managerId = String(formData.get("manager_id"));
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(managerId);
  revalidatePath("/admin/managers");
}
