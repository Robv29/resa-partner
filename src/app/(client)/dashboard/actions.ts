"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isoWeek } from "@/lib/format";
import { resend, FROM } from "@/lib/resend";
import { newPlateNotificationEmail } from "@/lib/email-templates";

export async function createBooking(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, site_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.site_id) throw new Error("Aucun site rattaché à ce compte");

  const plate = String(formData.get("plate") || "").trim().toUpperCase();
  const brandModel = String(formData.get("brand_model") || "").trim();
  const attentionNotes = String(formData.get("attention_notes") || "").trim();
  const selectedSiteOptionIds = formData.getAll("option") as string[];

  if (!plate) throw new Error("Immatriculation obligatoire");

  // 1) créer la réservation
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      site_id: profile.site_id,
      requested_by: profile.id,
      plate,
      brand_model: brandModel || null,
      attention_notes: attentionNotes || null,
      iso_week: isoWeek(),
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError || !booking) throw new Error(bookingError?.message || "Erreur création demande");

  // 2) attacher les options choisies, en figeant le prix du site à cet instant
  let optionNames: string[] = [];
  if (selectedSiteOptionIds.length > 0) {
    const { data: siteOptions } = await supabase
      .from("site_options")
      .select("id, price, option:options(id, name)")
      .in("id", selectedSiteOptionIds);

    if (siteOptions && siteOptions.length > 0) {
      const rows = siteOptions.map((so: any) => ({
        booking_id: booking.id,
        option_id: so.option.id,
        option_name: so.option.name,
        price: so.price,
      }));
      optionNames = rows.map((r) => r.option_name);
      await supabase.from("booking_options").insert(rows);
    }
  }

  // 3) notifier le manager du site + l'admin qu'une nouvelle plaque attend une planification
  try {
    const admin = createAdminClient();
    const { data: site } = await admin
      .from("sites")
      .select("name, manager:profiles!sites_manager_id_fkey(email, full_name)")
      .eq("id", profile.site_id)
      .single();

    const recipients = new Set<string>();
    if (process.env.NOTIFY_ADMIN_EMAIL) recipients.add(process.env.NOTIFY_ADMIN_EMAIL);
    const managerEmail = (site as any)?.manager?.email;
    if (managerEmail) recipients.add(managerEmail);

    if (recipients.size > 0) {
      await resend.emails.send({
        from: FROM,
        to: Array.from(recipients),
        subject: `Nouvelle plaque à planifier — ${(site as any)?.name || ""} (${plate})`,
        html: newPlateNotificationEmail({
          siteName: (site as any)?.name || "",
          plate,
          brandModel: brandModel || null,
          attentionNotes: attentionNotes || null,
          optionNames,
          requesterName: profile.full_name,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
        }),
      });
    }
  } catch (e) {
    // on ne bloque jamais la création de la demande si l'email échoue
    console.error("Erreur envoi email notification nouvelle plaque", e);
  }

  revalidatePath("/dashboard");
}
