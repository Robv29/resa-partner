"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

// Bouton de soumission générique pour les formulaires basés sur une Server
// Action directe (action={...} sans useTransition côté client). Sans état
// de chargement, un clic double (ou impatient) sur "Supprimer"/"Inviter"
// peut déclencher deux fois la même Server Action avant le rechargement de
// la page. useFormStatus() lit l'état du <form> parent le plus proche et
// permet de désactiver tous ses boutons pendant la soumission.
export default function SubmitButton({
  children,
  pendingText = "…",
  variant = "primary",
  className = "",
  formAction,
  formNoValidate,
  confirmMessage,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
  formAction?: (formData: FormData) => void;
  formNoValidate?: boolean;
  // Si renseigné, une confirmation navigateur est demandée avant l'envoi
  // (utile pour les actions destructrices type "Supprimer"/"Refuser").
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      formAction={formAction}
      formNoValidate={formNoValidate}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={buttonClass(variant, className)}
    >
      {pending ? pendingText : children}
    </button>
  );
}
