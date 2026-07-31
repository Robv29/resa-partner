import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client "secret key" (équivalent service_role) — bypass RLS. Réservé au
// cron et aux routes API qui doivent agir au-delà des permissions d'un
// utilisateur (ex: envoyer les relances hebdo, inviter un contact, notifier
// un manager). Ne JAMAIS exposer côté navigateur.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}
