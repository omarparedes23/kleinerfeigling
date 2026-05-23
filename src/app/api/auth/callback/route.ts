import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/perfil";

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      console.error("Auth callback exchange error:", error);
    } catch (err) {
      console.error("Auth callback exception:", err);
    }
  }

  // Redirect to login page with error param if authentication fails
  return NextResponse.redirect(
    new URL("/login?error=auth-callback-failed", request.url)
  );
}
