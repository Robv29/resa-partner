"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking } from "./actions";
import { formatEUR } from "@/lib/format";

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
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-brand">+ Ajouter une plaque à nettoyer</span>
        <span className="text-slate-400 text-sm">{open ? "Réduire" : "Ouvrir"}</span>
      </button>

      {open && (
        <form
          action={(fd) => startTransition(() => createBooking(fd))}
          className="mt-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Immatriculation *</label>
              <input
                name="plate"
                required
                placeholder="AA-123-BB"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marque / Modèle</label>
              <input
                name="brand_model"
                placeholder="Peugeot 208"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Point d'attention (goudron, taches, état particulier…)
            </label>
            <textarea
              name="attention_notes"
              rows={2}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {(base.length > 0 || extras.length > 0) && (
            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="space-y-2">
                {[...base, ...extras].map((so) => (
                  <label key={so.id} className="flex items-center justify-between text-sm border border-slate-200 rounded-md px-3 py-2">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="option"
                        value={so.id}
                        checked={!!selected[so.id]}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [so.id]: e.target.checked }))
                        }
                      />
                      {so.option?.name}
                      {so.option?.is_base && <span className="text-xs text-slate-400">(base)</span>}
                    </span>
                    <span className="text-slate-500">{formatEUR(Number(so.price))}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-medium">Total estimé</span>
            <span className="text-base font-bold text-brand">{formatEUR(total)}</span>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-brand text-white rounded-md py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </form>
      )}
    </div>
  );
}
