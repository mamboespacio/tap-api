"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";

const UpdateVendorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  openingHours: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  closingHours: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

function timeStringToDate(str: string): Date {
  const [h, m] = str.split(":").map(Number);
  const d = new Date(0);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export async function updateVendorAction(vendorId: number, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.owner_id !== user.id) throw new Error("Sin permiso.");

  const parsed = UpdateVendorSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    openingHours: formData.get("openingHours"),
    closingHours: formData.get("closingHours"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { name, address, openingHours, closingHours } = parsed.data;

  await db.vendor.update({
    where: { id: vendorId },
    data: {
      name,
      address,
      opening_hours: timeStringToDate(openingHours),
      closing_hours: timeStringToDate(closingHours),
    },
  });

  revalidatePath("/dashboard/vendor");
  redirect("/dashboard/vendor");
}
