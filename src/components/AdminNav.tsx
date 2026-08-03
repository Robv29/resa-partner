"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, CalendarClock, Building2, Receipt, Users, Building } from "lucide-react";

const baseNav = [
  { href: "/admin", label: "Vue d'ensemble", Icon: LayoutGrid },
  { href: "/admin/bookings", label: "Planification", Icon: CalendarClock },
  { href: "/admin/sites", label: "Sites", Icon: Building2 },
  { href: "/admin/billing", label: "Facturation", Icon: Receipt },
  { href: "/admin/managers", label: "Équipe interne", Icon: Users },
];

const superAdminNav = [{ href: "/admin/organizations", label: "Organisations", Icon: Building }];

export default function AdminNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const nav = isSuperAdmin ? [...baseNav, ...superAdminNav] : baseNav;

  return (
    <nav className="flex gap-1 text-sm">
      {nav.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              active ? "text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId="admin-nav-active-pill"
                className="absolute inset-0 rounded-md bg-white/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {!active && (
              <span className="absolute inset-0 rounded-md bg-white/0 hover:bg-white/5 transition-colors" />
            )}
            <item.Icon className="relative h-3.5 w-3.5" strokeWidth={2} />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
