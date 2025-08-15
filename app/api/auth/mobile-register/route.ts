import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  dni: z.string().min(7).max(15).regex(/^\d+$/),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, dni } = registerSchema.parse(body);

    // Verificar si ya existe el usuario
    const exists = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      return Response.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    // Hashear password
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario
    const created = await db.user.create({
      data: {
        email,
        fullName,
        dni,
        password: hashed,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        favouriteVendors: true,
        orders: true,
        addresses: true,
      },
    });

    // Generar token JWT
    const token = jwt.sign(
      { sub: created.id, email: created.email, name: created.fullName },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return Response.json({ token, user: created }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return Response.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    console.error("Error en registro mobile:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
