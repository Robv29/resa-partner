"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// Barre d'onglets de statut (Planification) avec une pastille active qui
// glisse d'un onglet à l'autre au lieu d'un simple changement de classe.
export default function StatusTabs({ tabs }: { tabs: { key: string; label: string; count: number }[] }) {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "pending";

  return (
    <div className="flex gap-1.5">
      {tabs.map((t) => {
        const active = status === t.key;
        return (
          <a
            key={t.key}
            href={`/admin/bookings?status=${t.key}`}
            className={`relative flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors ${
              active ? "border-ink text-white" : "bg-surface border-border text-ink-soft hover:border-border-strong"
            }`}
          >
            {active && (
              <motion.span
                layoutId="booking-tab-active-pill"
                className="absolute inset-0 rounded-md bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{t.label}</span>
            <span
              className={`relative min-w-[1.25rem] px-1 text-center text-xs font-semibold rounded-full tabular-nums ${
                active ? "bg-white/20 text-white" : "bg-black/[0.06] text-ink-soft"
              }`}
            >
              {t.count}
            </span>
          </a>
        );
      })}
    </div>
  );
}
