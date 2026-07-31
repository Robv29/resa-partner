"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createBooking } from "./actions";
import { formatEUR } from "@/lib/format";
import { inputClass, labelClass, buttonClass, panelClass } from "@/components/ui";

interface SiteOptionRow {
  id: string;
  price: number;
  option: { id: string; name: string; is_base: boolean } | null;
}

export default function NewBookingForm({ siteOptions }: { siteOptions: SiteOptionRow[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const total = useMemo(
    () => siteOptions.filter((so) => selected[so.id]).reduce((sum, so) => sum + Number(so.price), 0),
    [selected, siteOptions]
  );

  const base = siteOptions.filter((so) => so.option?.is_base);
  const extras = siteOptions.filter((so) => !so.option?.is_base);

  return (
    <div className={panelClass}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left p-5"
      >
        <span className="flex items-center gap-2 font-medium text-ink">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent-ink transition-transform ${open ? "rotate-45" : ""}`}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          Ajouter une plaque à nettoyer
        </span>
        <span className="text-ink-faint text-xs font-medium">{open ? "Réduire" : "Ouvrir"}</span>
      </button>

      {open && (
        <form
          action={(fd) => startTransition(() => createBooking(fd))}
          className="px-5 pb-5 space-y-4 border-t border-border pt-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Immatriculation *</label>
              <input name="plate" required placeholder="AA-123-BB" className={`${inputClass} uppercase`} />
            </div>
            <div>
              <label className={labelClass}>Marque / Modèle</label>
              <input name="brand_model" placeholder="Peugeot 208" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Point d'attention (goudron, taches, état particulier…)</label>
            <textarea name="attention_notes" rows={2} className={inputClass} />
          </div>

          {(base.length > 0 || extras.length > 0) && (
            <div>
              <label className={labelClass}>Options</label>
              <div className="space-y-1.5">
                {[...base, ...extras].map((so) => (
                  <label
                    key={so.id}
                    className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2 cursor-pointer hover:border-border-strong"
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        name="option"
                        value={so.id}
                        checked={!!selected[so.id]}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [so.id]: e.target.checked }))}
                        className="accent-accent h-4 w-4"
                      />
                      <span className="text-ink">{so.option?.name}</span>
                      {so.option?.is_base && <span className="text-xs text-ink-faint">(base)</span>}
                    </span>
                    <span className="text-ink-soft tabular-nums">{formatEUR(Number(so.price))}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm font-medium text-ink-soft">Total estimé</span>
            <span className="text-lg font-semibold text-ink tabular-nums">{formatEUR(total)}</span>
          </div>

          <button type="submit" disabled={isPending} className={buttonClass("primary", "w-full py-2.5")}>
            {isPending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </form>
      )}
    </div>
  );
}
