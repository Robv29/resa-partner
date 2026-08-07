import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Garde d'accès :
// - non connecté -> redirigé vers /login
// - client -> ne peut pas accéder à /admin
// - admin/manager/super_admin -> ne peut pas accéder à /dashboard (l'espace
//   client suppose un site_id, que le staff n'a jamais ; sans ce garde-fou,
//   un membre de l'équipe qui clique sur un lien client (ex: l'email de
//   rappel hebdo, qui pointe vers /dashboard) tombe sur l'écran d'erreur
//   "compte non rattaché à un site" au lieu d'être renvoyé vers son espace.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/api/cron") ||
    path.startsWith("/set-password") ||
    path.startsWith("/auth/confirm") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/onboarding");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path.startsWith("/admin") || path.startsWith("/dashboard"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isStaff = profile?.role === "admin" || profile?.role === "manager" || profile?.role === "super_admin";

    if (path.startsWith("/admin") && (!profile || profile.role === "client")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/dashboard") && isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
