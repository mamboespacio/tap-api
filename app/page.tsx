import { createClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = cookies();

  // Creamos el cliente de Supabase con SSR
  const supabase = await createClient();

  // Obtenemos la sesión del usuario (SSR seguro)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión → login
  if (!session) {
    redirect("/login");
  }

  // Si hay sesión → dashboard
  redirect("/dashboard");
}
