// app/api/auth/me/route.ts

// Forzamos el runtime a Node.js
export const runtime = 'nodejs';

import db from '@/lib/prisma';
// Importamos el helper de autenticación y los headers CORS
import { authenticateUser, corsHeaders } from '@/lib/authHelper'; 


export async function GET() {
  try {
    // 1. Autenticación centralizada
    const authResult = await authenticateUser();
    if (authResult instanceof Response) {
      // Si el helper devuelve un Response (error 401), lo retornamos
      return authResult;
    }
    // Si la autenticación fue exitosa, tenemos el user object de Supabase
    const userId = authResult.id; 

    // 2. Buscar el usuario completo en tu base de datos de Prisma
    const dbUser = await db.user.findUnique({
      where: { id: userId }, 
      include: {
        favouriteVendors: true,
        orders: true,
        addresses: true,
      },
    });

    if (!dbUser) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado en DB" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 3. Devolver los datos completos del usuario de tu DB
    return new Response(JSON.stringify(dbUser), {
      status: 200,
      headers: corsHeaders,
    });
    
  } catch (error) {
    console.error('Error al obtener perfil del usuario:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

// También puedes añadir la ruta OPTIONS si tu app Expo la necesita para pre-flight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
