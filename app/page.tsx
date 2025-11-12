// app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default async function RootPage() {
  // Cliente Supabase SSR
  const supabase = createClient();

  // Obtener la sesión del usuario en el servidor
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    // Si hay sesión, redirige al dashboard
    redirect("/dashboard");
  } else {
    // Si no hay sesión, redirige al login
    redirect("/login");
  }
}
