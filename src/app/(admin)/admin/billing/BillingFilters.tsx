"use client";

import { useRouter } from "next/navigation";

export default function BillingFilters({
  sites,
  months,
  currentSite,
  currentMonth,
}: {
  sites: { id: string; name: string }[];
  months: { value: string; label: string }[];
  currentSite: string;
  currentMonth: string;
}) {
  const router = useRouter();

  function update(site: string, month: string) {
    router.push(`/admin/billing?site=${site}&month=${month}`);
  }

  return (
    <div className="flex gap-3">
      <select
        value={currentSite}
        onChange={(e) => update(e.target.value, currentMonth)}
        className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        value={currentMonth}
        onChange={(e) => update(currentSite, e.target.value)}
        className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
