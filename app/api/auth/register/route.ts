export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/authHelper";
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
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de registro inválidos", details: parsed.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password, fullName, dni, vendorName, vendorAddress, openingHours, closingHours } =
      parsed.data;

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error al registrar en Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    const user = data.user;

    if (user) {
      await db.profile.upsert({
        where: { id: user.id },
        update: {
          email: user.email ?? email,
          full_name: fullName ?? undefined,
        },
        create: {
          id: user.id,
          email: user.email ?? email,
          full_name: fullName ?? null,
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
    }

    return NextResponse.json({ user: data.user ?? null, session: data.session ?? null }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("register POST error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}