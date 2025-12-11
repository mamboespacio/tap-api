"use server";
import { createClient } from "@/lib/supabase/server";
import { Role, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const supabase = await createClient();

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
    await prisma.profile.update({
      where: { id: userId },
      data: {
        role: Role.VENDOR,
        full_name: data.fullName ?? null,
        dni: data.dni,
      },
    });
    await prisma.vendor.create({
      data: {
        name: data.vendorName,
        address: data.vendorAddress || "Av. Siempre Viva 742",
        owner_id: userId,
      },
    });
  }
  catch (error) {
    // si falla borramos el usuario creado en Supabase Auth
    await prisma.profile.delete({
      where: { id: userId },
    });
    await supabase.auth.admin.deleteUser(userId);
    console.error("Error en createVendorProfile:", error);
    throw error;
  }
}

export async function registerVendorAction(data: VendorRegistrationData) {
  // Usamos la función asíncrona para obtener el cliente

  try {
    // 1. Registrar usuario en Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    const userId = authData.user!.id;

    // 2. Usar Prisma para crear el Vendor de forma segura (Server-side)
    await createVendorProfile(userId, data);

    return { success: true, message: "Vendor registrado exitosamente." };

  } catch (error: any) {
    console.error("Error en registerVendorAction:", error.message);
    throw new Error("Fallo al completar el registro.");
  }
}

// login action (for reference)
export async function loginAction(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}