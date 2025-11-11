// app/api/auth/register-vendor/route.ts
import { z } from "zod";
import db from "@/lib/prisma";
import bcrypt from "bcryptjs";

const Schema = z.object({
  user: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().optional().or(z.literal("")),
    dni: z.string().optional().or(z.literal("")),
  }),
  vendor: z.object({
    name: z.string().min(2),
    address: z.string().optional().or(z.literal("")),
    openingHours: z.string().optional().or(z.literal("")),
    closingHours: z.string().optional().or(z.literal("")),
  }),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { user: u, vendor: v } = Schema.parse(json);

    const exists = await db.user.findUnique({ where: { email: u.email } });
    if (exists) {
      return new Response(JSON.stringify({ error: "Email ya registrado" }), {
        status: 409, headers: { "Content-Type": "application/json" },
      });
    }

    const passwordHash = await bcrypt.hash(u.password, 10);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: u.email,
          password: passwordHash,
          fullName: u.fullName || null,
          dni: u.dni || null,
        },
        select: { id: true, email: true },
      });

      const vendor = await tx.vendor.create({
        data: {
          name: v.name,
          address: v.address || undefined,
          openingHours: v.openingHours ? new Date(v.openingHours) : undefined,
          closingHours: v.closingHours ? new Date(v.closingHours) : undefined,
          ownerId: user.id,
        },
        select: { id: true },
      });

      return { user, vendor };
    });

    return new Response(JSON.stringify(result), {
      status: 201, headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Error" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
}
