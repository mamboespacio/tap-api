// app/api/register/route.ts

// Forzamos el runtime a Node.js
export const runtime = 'nodejs';

import db from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server'; 
import { corsHeaders } from '@/lib/authHelper';
import { NextResponse } from 'next/server';
import { z } from 'zod'; // ✅ Importamos Zod directamente

// ✅ Definimos el esquema de registro con Zod aquí mismo
const RegisterSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  // Puedes añadir más campos si los necesitas, ej:
  // name: z.string().min(1, "El nombre es requerido"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    
    if (!parsed.success) {
      // Devolvemos los errores detallados de Zod si es necesario, o un mensaje genérico
      return new NextResponse(JSON.stringify({ 
          error: 'Datos de registro inválidos', 
          details: parsed.error.issues 
      }), { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const { email, password } = parsed.data;
    
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error al registrar usuario en Supabase:", error.message);
      return new NextResponse(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const user = data.user;

    if (!user) {
         return new NextResponse(JSON.stringify({ error: 'Registro completado, pero error al obtener datos de usuario.' }), { 
            status: 500,
            headers: corsHeaders 
      });
    }

    // Registrar el usuario en tu base de datos de Prisma (sincronización)
    const dbUser = await db.user.create({ 
        data: { 
            id: user.id, // Enlazar con el ID de Supabase (UUID)
            email: user.email!,
            // Asegúrate de que tu modelo Prisma/DB no requiera el campo 'password'
            // ya que ya no lo guardamos aquí.
        } 
    });
    
    return new NextResponse(JSON.stringify({ user: dbUser }), {
        status: 201, // 201 Created
        headers: corsHeaders
    });

  } catch (error) {
    console.error('Error general en registro:', error);
    return new NextResponse('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
