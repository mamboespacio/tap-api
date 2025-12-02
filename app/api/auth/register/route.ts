// app/api/auth/register/route.ts

// Asegúrate de que el runtime sea nodejs para interactuar con la base de datos (Prisma)
export const runtime = 'nodejs'; 

// Eliminamos imports manuales de auth
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

import db from "@/lib/prisma";
import { z } from "zod";
import { NextResponse } from 'next/server';

// Importamos nuestro helper centralizado de Supabase
import { createClient } from "@/lib/supabase/server"; 

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

    // 1. Usa el cliente de Supabase para manejar el registro de usuario
    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      // Puedes pasar datos adicionales al registro de Supabase aquí si tu configuración lo soporta
      // options: { data: { fullName, dni } } 
    });

    if (authError) {
      if (authError.code === "user_already_exists") {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // El usuario fue creado en Supabase Auth (authData.user)
    const supabaseUserId = authData.user?.id;

    if (!supabaseUserId) {
        return NextResponse.json({ error: "Error al crear usuario en Supabase" }, { status: 500 });
    }

    // 2. Opcional: Crear un registro adicional del usuario en tu tabla de Prisma
    //    Esto es común si usas Prisma para almacenar detalles que Supabase Auth no maneja directamente.
    const created = await db.user.create({
      data: {
        id: supabaseUserId, // Vinculamos el ID de Supabase al ID de Prisma
        email,
        fullName,
        dni,
        // Eliminamos el password hasheado manualmente, Supabase lo gestiona
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

    // Supabase gestiona la sesión (cookies/token). No necesitamos generar JWT manualmente.

    return NextResponse.json({ user: created, message: "Registro exitoso" }, { status: 201 });

  } catch (err: any) {
    // Manejo de errores de validación Zod u otros errores internos
    console.error("Error en registro:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
