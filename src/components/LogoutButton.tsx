"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        dark ? "text-white/60 hover:text-white" : "text-ink-soft hover:text-ink"
      }`}
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
      Déconnexion
    </button>
  );
}
