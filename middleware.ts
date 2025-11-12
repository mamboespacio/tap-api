// middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Actualizar la sesión de Supabase
  const { supabase, response } = await updateSession(request);

  // 2. Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Lógica de protección de rutas
  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const publicOnlyRoutes = ['/login', '/register'];

  // Redirigir a login si no hay usuario y se intenta acceder a ruta protegida
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    // Redirige al usuario a la página de login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Opcional: Redirigir fuera de login/registro si ya está logueado
  if (user && publicOnlyRoutes.some(route => pathname.startsWith(route))) {
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si todo está bien, permite que la solicitud continúe con la respuesta actualizada
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
