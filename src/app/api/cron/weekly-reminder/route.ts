import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM } from "@/lib/resend";
import { weeklyReminderEmail } from "@/lib/email-templates";
import { isoWeek, todayISOWeekday } from "@/lib/format";

// Appelé chaque jour par le Vercel Cron défini dans vercel.json (le jour
// exact d'envoi dépend désormais de sites.reminder_day, réglable par site
// dans sa fiche — auparavant tous les sites recevaient le rappel le même
// vendredi). Vercel ajoute automatiquement l'en-tête
// "Authorization: Bearer $CRON_SECRET" si la variable d'env CRON_SECRET est
// configurée sur le projet.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const week = isoWeek();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const weekday = todayISOWeekday();

  const { data: sites } = await admin
    .from("sites")
    .select("id, name")
    .eq("active", true)
    .eq("reminder_day", weekday);

  const results: { site: string; sent: number; skipped?: boolean }[] = [];

  for (const site of sites || []) {
    // anti-doublon : une seule relance par site et par semaine ISO
    const { data: existingLog } = await admin
      .from("weekly_reminder_log")
      .select("id")
      .eq("site_id", site.id)
      .eq("iso_week", week)
      .maybeSingle();

    if (existingLog) {
      results.push({ site: site.name, sent: 0, skipped: true });
      continue;
    }

    const { data: contacts } = await admin
      .from("profiles")
      .select("email")
      .eq("site_id", site.id)
      .eq("role", "client");

    const emails = (contacts || []).map((c) => c.email).filter(Boolean);
    if (emails.length === 0) {
      results.push({ site: site.name, sent: 0 });
      continue;
    }

    await resend.emails.send({
      from: FROM,
      to: emails,
      subject: `[VGS Autos] Besoin de nettoyage — semaine ${week}`,
      html: weeklyReminderEmail(site.name, week, appUrl),
    });

    await admin.from("weekly_reminder_log").insert({
      site_id: site.id,
      iso_week: week,
      recipients_count: emails.length,
    });

    results.push({ site: site.name, sent: emails.length });
  }

  return NextResponse.json({ week, results });
}
