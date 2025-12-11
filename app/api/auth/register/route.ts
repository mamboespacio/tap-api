import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
// Si ya tienes una Server Action que crea el vendor en tu DB puedes importarla.
// import { registerVendorAction } from "@/app/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      dni,
      vendorName,
      vendorAddress,
      openingHours,
      closingHours,
    } = body ?? {};

    if (!email || !password || !vendorName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Pasamos el cookieStore para que createClient pueda setear cookies de sesión en la respuesta
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Crear el usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // data.user y data.session pueden ser null si requiere confirmación por email.
    // Si tu flujo requiere crear además un registro "vendor" en tu base de datos,
    // puedes hacerlo aquí. Ejemplo:
    //
    // if (data.user) {
    //   // registerVendorAction sería una Server Action que crea el vendor en la BD.
    //   // Asegúrate que registerVendorAction esté disponible para ser llamada desde aquí.
    //   await registerVendorAction({
    //     userId: data.user.id,
    //     fullName,
    //     dni,
    //     vendorName,
    //     vendorAddress,
    //     openingHours,
    //     closingHours,
    //   });
    // }
    //
    // Si prefieres crear el vendor sólo después de que el usuario confirme su email,
    // deja esta parte para otro flow (webhook, confirmación, o al completar perfil).

    // Devolver user y session para que clientes móviles puedan guardar tokens.
    return NextResponse.json({ user: data.user, session: data.session }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}