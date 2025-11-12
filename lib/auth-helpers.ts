// lib/auth-helpers.ts

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Obtiene la sesión del usuario o redirige a la página de inicio de sesión.
 * @returns El objeto de sesión y usuario si está autenticado.
 */
export async function getSessionOrRedirect() {
  const cookieStore = cookies();
  // Ajusta createClient si necesita el cookieStore como argumento:
  // const supabase = await createClient(cookieStore); 
  const supabase = await createClient(); 

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    // Redirige al usuario si no hay sesión activa
    redirect(`/login?returnTo=${encodeURIComponent((await cookies()).get('next-url')?.value || '/')}`);
  }

  return { session, user: session.user };
}

/**
 * Obtiene solo el ID del usuario o redirige.
 * @returns El ID del usuario si está autenticado.
 */
export async function getUserIdOrRedirect() {
    const { user } = await getSessionOrRedirect();
    return user.id;
}