import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { VIEWING_ORG_COOKIE } from "@/lib/auth-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, organization_id")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "client") redirect("/dashboard");

  const isSuperAdmin = profile.role === "super_admin";
  const organizations = isSuperAdmin
    ? (await supabase.from("organizations").select("id, name").order("name")).data || []
    : [];
  const viewingCookie = cookies().get(VIEWING_ORG_COOKIE)?.value;
  const currentOrgId = isSuperAdmin ? (viewingCookie === "__all__" ? null : viewingCookie || profile.organization_id) : null;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        isSuperAdmin={isSuperAdmin}
        organizations={organizations}
        currentOrgId={currentOrgId}
        fullName={profile.full_name}
        role={profile.role}
      />
      <main className="ml-[252px] max-w-[1400px] p-8">{children}</main>
    </div>
  );
}
