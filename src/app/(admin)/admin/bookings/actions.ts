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
