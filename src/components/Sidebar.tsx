"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, CalendarClock, Building2, Receipt, Users, Building } from "lucide-react";
import OrgSwitcher from "@/components/OrgSwitcher";
import LogoutButton from "@/components/LogoutButton";

const baseNav = [
  { href: "/admin", label: "Vue d'ensemble", Icon: LayoutGrid },
  { href: "/admin/bookings", label: "Planification", Icon: CalendarClock },
  { href: "/admin/sites", label: "Sites", Icon: Building2 },
  { href: "/admin/billing", label: "Facturation", Icon: Receipt },
  { href: "/admin/managers", label: "Équipe interne", Icon: Users },
];

const superAdminNav = [{ href: "/admin/organizations", label: "Organisations", Icon: Building }];

// Navigation verticale fixe (identité de marque : navy + or), remplace
// l'ancien header horizontal. Reste un client component (usePathname +
// pilule active animée), le reste de la page (Server Components) est
// inchangé en dessous.
export default function Sidebar({
  isSuperAdmin,
  organizations,
  currentOrgId,
  fullName,
  role,
}: {
  isSuperAdmin: boolean;
  organizations: { id: string; name: string }[];
  currentOrgId: string | null;
  fullName: string;
  role: string;
}) {
  const pathname = usePathname();
  const nav = isSuperAdmin ? [...baseNav, ...superAdminNav] : baseNav;

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = role === "super_admin" ? "Résa Partner" : role === "admin" ? "Administrateur" : "Manager";

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[252px] flex-col bg-gradient-to-b from-navy to-navy-deep">
      {/* Halo décoratif discret derrière le logo, cohérent avec les blobs des
          pages publiques (login/onboarding) */}
      <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

      <div className="relative flex items-center gap-2.5 px-5 pt-6 pb-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white p-1.5">
          <Image src="/logo-mark.png" alt="Résa Partner" width={36} height={36} className="h-full w-full object-contain" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-[-0.01em] text-white">Résa</p>
          <p className="text-sm font-semibold tracking-[-0.01em] text-gold -mt-0.5">Partner</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-0.5 px-3">
        {nav.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                active ? "text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-nav-active-pill"
                  className="absolute inset-0 rounded-md bg-white/10"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <item.Icon className="relative h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="relative font-medium">{item.label}</span>
              {active && <span className="absolute right-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-l-full bg-gold" />}
            </Link>
          );
        })}
      </nav>

      {isSuperAdmin && (
        <div className="relative px-3 pb-3">
          <OrgSwitcher organizations={organizations} currentOrgId={currentOrgId} />
        </div>
      )}

      <div className="relative mx-3 mb-4 flex items-center gap-2.5 rounded-lg bg-white/[0.06] p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium text-white">{fullName}</p>
          <p className="text-xs text-white/50">{roleLabel}</p>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-5 py-3.5">
        <LogoutButton dark />
      </div>
    </aside>
  );
}
