import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante: No uses auth.getSession() aquí ya que puede ser vulnerado.
  // getUser() valida el token en el servidor de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);

  // Proteger rutas de perfil y pedidos (y subrutas)
  const isProtectedPath =
    url.pathname.startsWith("/perfil") ||
    url.pathname.startsWith("/pedidos") ||
    /^\/pedido(\/.*)?$/.test(url.pathname);

  if (isProtectedPath) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", url.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirigir a perfil si ya está autenticado e intenta ir a login o registro
  const isAuthPath =
    url.pathname.startsWith("/login") || url.pathname.startsWith("/registro");
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/perfil", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - archivos con extensiones comunes (imágenes, fuentes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css)$).*)",
  ],
};
