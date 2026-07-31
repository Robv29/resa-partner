// Petit système de design partagé — évite de retaper des classes Tailwind
// dispersées partout. Sert de source unique pour boutons, champs, panneaux,
// badges de statut, utilisés sur toutes les pages admin et client.

export const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus-visible:border-accent";

export const labelClass = "block text-xs font-medium text-ink-soft mb-1.5";

export const panelClass = "rounded-lg border border-border bg-surface";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-border hover:border-border-strong",
  ghost: "text-ink-soft hover:text-ink hover:bg-black/[0.03]",
  danger: "text-red-600 hover:bg-red-50",
};

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return [
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
    buttonVariants[variant],
    className,
  ].join(" ");
}
