"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Role } from "@prisma/client";
import db from "@/lib/prisma";

interface VendorRegistrationData {
  email: string;
  password: string;
  fullName?: string;
  dni?: string;
  vendorName: string;
  vendorAddress?: string;
  openingHours?: string;
  closingHours?: string;
}

async function createVendorProfile(userId: string, data: VendorRegistrationData) {
  try {
    await db.profile.update({
      where: { id: userId },
      data: {
        role: Role.VENDOR,
        full_name: data.fullName ?? null,
        dni: data.dni,
      },
    });
    await db.vendor.create({
      data: {
        name: data.vendorName,
        address: data.vendorAddress || "Av. Siempre Viva 742",
        owner_id: userId,
      },
    });
  } catch (error) {
    // Rollback: delete profile row and auth user so the email can be reused
    await db.profile.delete({ where: { id: userId } }).catch(() => {});
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(userId);
    } catch (adminErr) {
      console.error("No se pudo limpiar el usuario auth tras fallo de registro:", adminErr);
    }
    console.error("Error en createVendorProfile:", error);
    throw error;
  }
}

export async function registerVendorAction(data: VendorRegistrationData) {
  const supabase = await createClient();

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    const userId = authData.user!.id;

    await createVendorProfile(userId, data);

    return { success: true, message: "Vendor registrado exitosamente." };
  } catch (error: any) {
    console.error("Error en registerVendorAction:", error.message);
    throw new Error("Fallo al completar el registro.");
  }
}

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
