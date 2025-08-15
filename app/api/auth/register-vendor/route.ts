// app/api/vendors/register/route.ts
import bcrypt from "bcryptjs";
import db from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { user, vendor } = await req.json();

    // Validaciones mínimas
    if (!user?.email || !user?.password || !vendor?.name) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // Evitar duplicados por email y vendor.name
    const [existingUser, existingVendor] = await Promise.all([
      db.user.findUnique({ where: { email: user.email } }),
      db.vendor.findUnique({ where: { name: vendor.name } }),
    ]);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "El email ya existe" }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }
    if (existingVendor) {
      return new Response(JSON.stringify({ error: "El nombre de vendor ya existe" }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }

    const hashed = await bcrypt.hash(user.password, 10);

    // Transacción: crear user y vendor conectados
    const result = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: user.email,
          password: hashed,
          fullName: user.fullName ?? null,
          dni: user.dni ?? null,
        },
      });

      const createdVendor = await tx.vendor.create({
        data: {
          name: vendor.name,
          address: vendor.address ?? "Av. Siempre Viva 742",
          openingHours: vendor.openingHours ? new Date(vendor.openingHours) : new Date("1970-01-01T10:00:00.000Z"),
          closingHours: vendor.closingHours ? new Date(vendor.closingHours) : new Date("1970-01-01T18:00:00.000Z"),
          ownerId: createdUser.id,
        },
      });

      return { createdUser, createdVendor };
    });

    // Nunca devolver password
    const safeUser = { ...result.createdUser, password: undefined };

    return new Response(JSON.stringify({ user: safeUser, vendor: result.createdVendor }), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Error interno" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
