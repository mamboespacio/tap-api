// app/api/auth/mobile-login/route.ts

export const runtime = 'nodejs'; 

import { NextResponse, NextRequest } from 'next/server';

// ✅ Importa tu helper centralizado
import { createClient } from "@/lib/supabase/server"; 

// Importa tu cliente de Prisma si es necesario
// import db from '@/lib/prisma'; 

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  
  if (!email || !password) {
    return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
  }

  // 1. Usa tu helper personalizado para obtener el cliente Supabase
  //    Asumo que este helper se encarga de pasar las cookies automáticamente
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error de inicio de sesión de Supabase:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // 2. Devuelve una respuesta exitosa
  return NextResponse.json({ 
    message: "Inicio de sesión exitoso"
  });
}
