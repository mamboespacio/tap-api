import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Obtiene el usuario autenticado en el servidor o redirige a /login.
 * Usa supabase.auth.getUser() (que valida la sesión con el servidor de Auth).
 */
export async function getSessionOrRedirect() {
  // cookies() es síncrono en next/headers
  const cookieStore = cookies();

  // Pasamos el mismo cookieStore a createClient para que use las mismas cookies
  const supabase = createClient(cookieStore);

  // Obtener user validado por Supabase Auth (no solo lo que hay en la cookie)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    // Si existe una cookie 'next-url' la usamos como returnTo, si no usamos '/'
    const returnTo = cookieStore.get('next-url')?.value ?? '/';
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return { user };
}

/**
 * Obtiene solo el ID del usuario o redirige.
 */
export async function getUserIdOrRedirect() {
  const { user } = await getSessionOrRedirect();
  return user.id;
}