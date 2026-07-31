"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client Supabase utilisé dans les composants navigateur ("use client").
// Respecte les policies RLS avec le rôle de l'utilisateur connecté.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
