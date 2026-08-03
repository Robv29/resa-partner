"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { switchViewingOrg } from "@/app/(admin)/admin/organizations/actions";

// Sélecteur "Agir en tant que" réservé au super_admin : détermine quelle
// organisation les pages admin affichent/modifient. Soumis automatiquement
// au changement (pas besoin d'un bouton "Valider" en plus).
export default function OrgSwitcher({
  organizations,
  currentOrgId,
}: {
  organizations: { id: string; name: string }[];
  currentOrgId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();

  return (
    <form ref={formRef} action={switchViewingOrg} className="flex items-center gap-1.5">
      <input type="hidden" name="redirect_to" value={pathname || "/admin"} />
      <select
        name="org_id"
        defaultValue={currentOrgId ?? "__all__"}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white outline-none transition-colors hover:bg-white/15 focus-visible:border-white/40"
      >
        <option value="__all__" className="text-ink">Toutes les organisations</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id} className="text-ink">
            {org.name}
          </option>
        ))}
      </select>
    </form>
  );
}
