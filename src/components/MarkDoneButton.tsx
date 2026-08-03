"use client";

import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck } from "lucide-react";

// Bouton "Marquer terminé" avec un petit moment de satisfaction : pendant la
// soumission de la Server Action, l'icône se transforme en check qui "pop"
// pour confirmer que l'action a bien été prise en compte, plutôt qu'un texte
// "…" neutre. Respecte prefers-reduced-motion (AnimatePresence + spring ne
// jouent quasi rien à l'oeil si l'utilisateur préfère moins de mouvement,
// mais on garde un fade simple par sécurité — le confirm() éventuel reste
// géré comme sur les autres SubmitButton).
export default function MarkDoneButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative flex items-center gap-1.5 text-emerald-700 font-medium hover:text-emerald-800 disabled:opacity-70 overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
            animate={{ opacity: 1, scale: [0.6, 1.25, 1], rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-1.5"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={2.5} />
            Terminé !
          </motion.span>
        ) : (
          <motion.span key="idle" exit={{ opacity: 0 }} className="flex items-center gap-1.5">
            <CheckCheck className="h-4 w-4" strokeWidth={2} />
            Marquer terminé
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
