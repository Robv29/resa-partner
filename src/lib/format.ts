// Semaine ISO au format "2026-W31" — utilisée pour regrouper les relances
// et les demandes par semaine, dans l'esprit du "N° de semaine" du bon de
// commande papier.
export function isoWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Date du jour au format "YYYY-MM-DD", dans le fuseau France (le serveur de
// déploiement tourne en UTC — sans ça "aujourd'hui" pourrait décaler d'un
// jour selon l'heure).
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

// Jour ISO du jour (1=lundi ... 7=dimanche), dans le fuseau France — utilisé
// par le cron de relance quotidien pour savoir quels sites notifier
// aujourd'hui (chaque site a son propre jour via sites.reminder_day).
export function todayISOWeekday(): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" }).format(new Date());
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[weekday] ?? 5;
}

export const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

// Ajoute N jours (peut être négatif) à une date ISO "YYYY-MM-DD" (ou à
// aujourd'hui par défaut), en restant en dates civiles pures (pas de piège
// de fuseau horaire type "23h -> jour d'avant").
export function addDaysISO(days: number, from: string = todayISO()): string {
  const [y, m, d] = from.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatDateFR(date: string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(date)
  );
}

// Bornes [début, fin[ du mois pour une valeur "YYYY-MM" (utilisé en facturation)
export function monthRange(yyyyMm: string): { start: string; end: string } {
  const [y, m] = yyyyMm.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

// Génère les 12 derniers mois au format "YYYY-MM" pour le sélecteur d'historique
export function lastMonths(count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(d);
    out.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}
