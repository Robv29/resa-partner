import { redirect } from "next/navigation";
import { Droplets } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || profile.role === "client") redirect("/dashboard");

  const initials = profile.full_name
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="bg-ink">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white">
                <Droplets className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
              <span className="font-semibold text-white text-sm tracking-[-0.01em]">VGS Autos</span>
            </div>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white text-xs font-semibold">
              {initials}
            </span>
            <LogoutButton dark />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
