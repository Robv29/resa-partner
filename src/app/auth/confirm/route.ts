import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Point d'entrée unique pour tous les liens email Supabase (invitation,
// réinitialisation de mot de passe, magic link). Le template email pointe
// ici avec un token_hash + type ; on l'échange contre une session côté
// serveur (cookies), puis on redirige vers la page finale (set-password).
// Nécessaire car le client navigateur utilise le flow PKCE (@supabase/ssr),
// qui ne sait pas consommer les liens "implicit" (#access_token=...)
// générés par les emails d'invitation/recovery envoyés depuis le serveur.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/set-password";

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const redirectUrl = new URL(next, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  const errorUrl = new URL("/login", request.url);
  errorUrl.searchParams.set("error", "Lien invalide ou expiré, redemandez une invitation.");
  return NextResponse.redirect(errorUrl);
}
