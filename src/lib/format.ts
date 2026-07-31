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
