import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/perfil";

  if (code) {
    // Create the redirect response first so cookies can be set directly on it.
    // Using next/headers cookies() here doesn't work reliably with redirect responses
    // in Next.js App Router — the session cookies would be lost.
    const redirectResponse = NextResponse.redirect(new URL(next, requestUrl));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        console.log("✅ [AUTH CALLBACK] Sesión establecida, redirigiendo a:", next);
        return redirectResponse;
      }
      console.error("🔴 [AUTH CALLBACK] exchangeCodeForSession error:", error.message);
    } catch (err) {
      console.error("🔴 [AUTH CALLBACK] excepción:", err);
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth-callback-failed", requestUrl),
  );
}
