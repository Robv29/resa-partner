import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || profile.role === "client") redirect("/dashboard");

  const nav = [
    { href: "/admin", label: "Vue d'ensemble" },
    { href: "/admin/bookings", label: "Planification" },
    { href: "/admin/sites", label: "Sites" },
    { href: "/admin/billing", label: "Facturation" },
    { href: "/admin/managers", label: "Équipe interne" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-brand text-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bold">VGS Autos — Admin</span>
            <nav className="flex gap-5 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-slate-200 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">{profile.full_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
