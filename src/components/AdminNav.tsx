"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CalendarClock, Building2, Receipt, Users } from "lucide-react";

const nav = [
  { href: "/admin", label: "Vue d'ensemble", Icon: LayoutGrid },
  { href: "/admin/bookings", label: "Planification", Icon: CalendarClock },
  { href: "/admin/sites", label: "Sites", Icon: Building2 },
  { href: "/admin/billing", label: "Facturation", Icon: Receipt },
  { href: "/admin/managers", label: "Équipe interne", Icon: Users },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 text-sm">
      {nav.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
