export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/authHelper";
import { rateLimit } from "@/lib/ratelimit";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { allowed, remaining, retryAfterMs } = rateLimit(`auth:login:${ip}`, 10, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intentá de nuevo en un momento." },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Credenciales inválidas", details: parsed.error.issues },
        { status: 400, headers: corsHeaders },
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Error de inicio de sesión en Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 401, headers: corsHeaders });
    }

    return NextResponse.json(
      { user: data.user ?? null, session: data.session ?? null },
      { status: 200, headers: { ...corsHeaders, "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (err: any) {
    console.error("login POST error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
