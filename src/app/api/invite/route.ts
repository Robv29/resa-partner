import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Crée un compte individuel (contact client ou manager interne) et envoie
// l'email d'invitation (défini le mot de passe) via Supabase Auth.
// Admin uniquement.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const body = await req.json();
  const { email, full_name, role, site_id } = body as {
    email: string;
    full_name: string;
    role: "client" | "manager";
    site_id?: string | null;
  };

  if (!email || !full_name || !role) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });

  if (inviteError || !invited?.user) {
    return NextResponse.json({ error: inviteError?.message || "Échec de l'invitation" }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    role,
    full_name,
    email,
    site_id: role === "client" ? site_id ?? null : null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
