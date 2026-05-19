"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";

const UpdateProfileSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido"),
  dni: z.string().optional(),
});

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const parsed = UpdateProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    dni: formData.get("dni") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await db.profile.update({
    where: { id: user.id },
    data: {
      full_name: parsed.data.full_name,
      dni: parsed.data.dni ?? null,
    },
  });

  revalidatePath("/dashboard/user");
  redirect("/dashboard/user");
}
