// src/app/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server"; 

interface CreateVendorPayload {
  name: string;
  address?: string;
  openingHours?: string;
  closingHours?: string;
}

export async function createVendorAction(vendorData: CreateVendorPayload) {
  const supabase = await createClient(); 

  // 1. Obtén el usuario autenticado de forma segura en el servidor
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated for this action.");
  }

  // 2. Inserta los datos del vendor, vinculándolos al ID de usuario verificado
  const { data, error } = await supabase.from("vendors").insert([
    {
      ...vendorData,
      ownerId: user.id, // ID del usuario obtenido de forma segura
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("Error al crear el comercio: " + error.message);
  }

  // Puedes devolver los datos creados si es necesario
  return data;
}
