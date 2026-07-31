"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function scheduleBooking(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const bookingId = String(formData.get("booking_id"));
  const date = String(formData.get("scheduled_date"));
  const time = String(formData.get("scheduled_time"));
  if (!bookingId || !date || !time) throw new Error("Date et heure requises");

  const { error } = await supabase
    .from("bookings")
    .update({ status: "scheduled", scheduled_date: date, scheduled_time: time, scheduled_by: user.id })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

// Ajoute une option supplémentaire à une réservation déjà planifiée (ex: le
// convoyeur constate sur place qu'il faut un dégoudronnage en plus). Le prix
// est celui en vigueur pour ce site au moment de l'ajout.
export async function addBookingOption(formData: FormData) {
  const supabase = createClient();
  const bookingId = String(formData.get("booking_id"));
  const siteId = String(formData.get("site_id"));
  const optionId = String(formData.get("option_id"));
  if (!optionId) throw new Error("Choisis une option");

  const { data: siteOption, error: siteOptionError } = await supabase
    .from("site_options")
    .select("price, option:options(name)")
    .eq("site_id", siteId)
    .eq("option_id", optionId)
    .eq("active", true)
    .single();
  if (siteOptionError || !siteOption) throw new Error("Option indisponible pour ce site");

  const { error } = await supabase.from("booking_options").insert({
    booking_id: bookingId,
    option_id: optionId,
    option_name: (siteOption.option as any)?.name || "",
    price: siteOption.price,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/billing");
}

export async function markDone(formData: FormData) {
  const supabase = createClient();
  const bookingId = String(formData.get("booking_id"));
  const { error } = await supabase.from("bookings").update({ status: "done" }).eq("id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
}

export async function cancelBooking(formData: FormData) {
  const supabase = createClient();
  const bookingId = String(formData.get("booking_id"));
  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
}
