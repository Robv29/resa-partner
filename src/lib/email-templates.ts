// Templates HTML simples, sans dépendance supplémentaire (pas de React Email)
// pour rester léger. Le style reprend l'identité "Résa Partner".

// Toute donnée saisie par un utilisateur (plaque, modèle, notes, nom du
// site, nom du demandeur...) est interpolée directement dans du HTML. Sans
// échappement, un site pourrait injecter du HTML/JS dans le corps de
// l'email reçu par l'équipe Résa Partner (ex: plaque = "<img src=x onerror=...>").
// On échappe systématiquement toute valeur variable avant de l'insérer.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const wrapper = (title: string, body: string) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
  <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
    <span style="color:#fff;font-size:18px;font-weight:bold;">RÉSA PARTNER</span>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <h2 style="margin-top:0;font-size:17px;">${title}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#64748b;">Résa Partner — Cet email est généré automatiquement par l'espace de réservation.</p>
  </div>
</div>`;

export function weeklyReminderEmail(siteName: string, isoWeek: string, appUrl: string) {
  const safeSiteName = escapeHtml(siteName);
  return wrapper(
    `Besoin de nettoyage — semaine ${escapeHtml(isoWeek)}`,
    `
    <p>Bonjour,</p>
    <p>Merci de renseigner dès que possible les véhicules de <strong>${safeSiteName}</strong> à nettoyer cette semaine.</p>
    <p style="margin:24px 0;">
      <a href="${appUrl}/dashboard" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Remplir le besoin
      </a>
    </p>
    <p>Chaque plaque ajoutée nous permet de planifier le jour et l'heure de passage, visibles ensuite directement dans votre espace.</p>
    `
  );
}

export function newPlateNotificationEmail(params: {
  siteName: string;
  plate: string;
  brandModel: string | null;
  attentionNotes: string | null;
  optionNames: string[];
  requesterName: string;
  appUrl: string;
}) {
  const { plate, brandModel, attentionNotes, optionNames, requesterName, appUrl } = params;
  const siteName = escapeHtml(params.siteName);
  const safePlate = escapeHtml(plate);
  const safeBrandModel = brandModel ? escapeHtml(brandModel) : null;
  const safeAttentionNotes = attentionNotes ? escapeHtml(attentionNotes) : null;
  const safeOptionNames = optionNames.map(escapeHtml);
  const safeRequesterName = escapeHtml(requesterName);
  return wrapper(
    `Nouvelle plaque à planifier — ${siteName}`,
    `
    <p><strong>${siteName}</strong> vient de déposer une nouvelle demande, à planifier (jour + heure).</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:4px 0;color:#64748b;">Immatriculation</td><td style="padding:4px 0;font-weight:bold;">${safePlate}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Véhicule</td><td style="padding:4px 0;">${safeBrandModel || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Options</td><td style="padding:4px 0;">${safeOptionNames.join(", ") || "Aucune"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Point d'attention</td><td style="padding:4px 0;">${safeAttentionNotes || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Demandé par</td><td style="padding:4px 0;">${safeRequesterName}</td></tr>
    </table>
    <p style="margin:24px 0;">
      <a href="${appUrl}/admin/bookings" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Planifier jour / heure
      </a>
    </p>
    `
  );
}
