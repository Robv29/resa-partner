// Petit système de design partagé — évite de retaper des classes Tailwind
// dispersées partout. Sert de source unique pour boutons, champs, panneaux,
// badges de statut, utilisés sur toutes les pages admin et client.

export const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] duration-200 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10";

export const labelClass = "block text-xs font-medium text-ink-soft mb-1.5";

export const panelClass = "rounded-lg border border-border bg-surface";

// Légère élévation au survol pour les panneaux cliquables (lignes de liste,
// cartes de site...) — un signal de vie discret plutôt qu'un simple
// changement de couleur de bordure.
export const panelHoverClass =
  "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[1px] hover:border-border-strong hover:shadow-[0_4px_16px_-4px_rgba(15,23,30,0.10)]";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  // Le CTA principal reprend l'or du logo : c'est la couleur qui doit sauter
  // aux yeux pour "l'action qui fait avancer" (envoyer, enregistrer, valider).
  primary: "bg-gold text-white hover:bg-gold-hover shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
  secondary: "bg-surface text-ink border border-border hover:border-border-strong",
  ghost: "text-ink-soft hover:text-ink hover:bg-black/[0.03]",
  danger: "text-red-600 hover:bg-red-50",
};

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return [
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium",
    "transition-[transform,background-color,box-shadow,border-color,color] duration-150",
    "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
    buttonVariants[variant],
    className,
  ].join(" ");
}
