import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth middleware — refreshes the Supabase session cookie on every request
 * and gates /dashboard, /quotes, /clients, /templates, /settings routes.
 * Public routes: /, /login, /auth/callback, /q/[token] (client magic links).
 */
const STAFF_PREFIXES = [
  "/dashboard",
  "/quotes",
  "/clients",
  "/templates",
  "/settings",
  "/surveys",
  "/reports",
];

const CLIENT_PREFIX = "/client";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isStaffArea  = STAFF_PREFIXES.some((p) => pathname.startsWith(p));
  const isClientArea = pathname === CLIENT_PREFIX || pathname.startsWith(`${CLIENT_PREFIX}/`);

  if ((isStaffArea || isClientArea) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // For logged-in users, enforce role-based area separation.
  if (user && (isStaffArea || isClientArea)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();
    const isClient = profile?.user_type === "client";

    if (isStaffArea && isClient) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }
    if (isClientArea && !isClient) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - static files (_next/static, _next/image)
     * - favicon
     * - image files (svg/png/jpg/jpeg/gif/webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
