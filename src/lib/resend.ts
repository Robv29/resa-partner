import { Resend } from "resend";

// Le SDK Resend jette une erreur si on lui passe une clé vide au moment de
// l'instanciation. On retombe sur une valeur factice pour ne pas casser le
// build quand RESEND_API_KEY n'est pas encore configurée (ex: build local) ;
// un envoi réel échouera alors proprement avec une erreur API explicite,
// plutôt que de faire planter toute l'app au démarrage.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_build_placeholder");
export const FROM = process.env.RESEND_FROM_EMAIL || "VGS Autos <onboarding@resend.dev>";
