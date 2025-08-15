// /app/api/auth/mobile-login/route.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Datos inválidos" }, 400);

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return json({ error: "Credenciales inválidas" }, 401);

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return json({ error: "Credenciales inválidas" }, 401);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.fullName,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    const { password: _pw, ...safeUser } = user;
    return json({ token, user: safeUser }, 200);
  } catch (e) {
    return json({ error: "Error interno del servidor" }, 500);
  }
}

// CORS preflight (opcional pero útil)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
