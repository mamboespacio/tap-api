export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { corsHeaders } from "@/lib/authHelper";
import { rateLimit } from "@/lib/ratelimit";
import { Role } from "@prisma/client";
import db from "@/lib/prisma";

const RegisterSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().optional(),
  dni: z.string().optional(),
  vendorName: z.string().optional(),
  vendorAddress: z.string().optional(),
  openingHours: z.string().optional(),
  closingHours: z.string().optional(),
});

export async function POST(req: Request) {
  const ip =
    (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) ?? "anonymous";
  const { allowed, retryAfterMs } = rateLimit(`auth:register:${ip}`, 5, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos de registro. Intentá de nuevo en un momento." },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      },
    );
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de registro inválidos", details: parsed.error.issues },
        { status: 400, headers: corsHeaders },
      );
    }

    const { email, password, fullName, dni, vendorName, vendorAddress, openingHours, closingHours } =
      parsed.data;

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Error al registrar en Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    const user = data.user;

    if (user) {
      try {
        await db.profile.upsert({
          where: { id: user.id },
          update: {
            email: user.email ?? email,
            full_name: fullName ?? undefined,
            ...(vendorName ? { role: Role.VENDOR } : {}),
          },
          create: {
            id: user.id,
            email: user.email ?? email,
            full_name: fullName ?? null,
            role: vendorName ? Role.VENDOR : Role.CUSTOMER,
          },
        });

        if (vendorName) {
          await db.vendor.create({
            data: {
              owner_id: user.id,
              name: vendorName,
              address: vendorAddress ?? "Av. Siempre Viva 742",
              opening_hours: openingHours ? new Date(openingHours) : undefined,
              closing_hours: closingHours ? new Date(closingHours) : undefined,
            },
          });
        }
      } catch (dbError: any) {
        // Rollback: clean up profile and auth user so the email is reusable
        await db.profile.delete({ where: { id: user.id } }).catch(() => {});
        try {
          const admin = createAdminClient();
          await admin.auth.admin.deleteUser(user.id);
        } catch (adminErr) {
          console.error("No se pudo limpiar el usuario auth tras fallo de registro:", adminErr);
        }
        console.error("register DB error:", dbError);
        return NextResponse.json(
          { error: "Error al crear el perfil. Intente de nuevo." },
          { status: 500, headers: corsHeaders },
        );
      }
    }

    return NextResponse.json(
      { user: data.user ?? null, session: data.session ?? null },
      { status: 200, headers: corsHeaders },
    );
  } catch (err: any) {
    console.error("register POST error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
