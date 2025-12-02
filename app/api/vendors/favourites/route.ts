// /app/api/vendors/favourites/route.ts

// Forzamos el runtime a Node.js
export const runtime = 'nodejs';

import db from "@/lib/prisma";
// Importamos el helper de autenticación y los headers CORS
import { authenticateUser, corsHeaders } from '@/lib/authHelper';


// POST: Añadir o quitar un vendedor favorito
export async function POST(req: Request) {
  try {
    // 1. Autenticación centralizada
    const authResult = await authenticateUser();
    if (authResult instanceof Response) {
      return authResult; 
    }
    const userId = authResult.id; 

    const { vendorId, action } = await req.json();

    const vendorIdNum = Number(vendorId);
    if (!Number.isFinite(vendorIdNum) || vendorIdNum <= 0) {
      return new Response(JSON.stringify({ error: "vendorId inválido" }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const isRemove = action === "remove";

    await db.user.update({
      where: { id: userId }, // Usamos el userId de Supabase (que es string/UUID)
      data: isRemove
        ? { favouriteVendors: { disconnect: { id: vendorIdNum } } }
        : { favouriteVendors: { connect: { id: vendorIdNum } } },
    });

    // payload útil para optimistic update
    return new Response(JSON.stringify({ vendorId: vendorIdNum, isFavourite: !isRemove }), {
        status: 200,
        headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Error al gestionar favoritos:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
        status: 500,
        headers: corsHeaders
    });
  }
}

// GET: Obtener todos los vendedores favoritos del usuario
export async function GET() {
  try {
    // 1. Autenticación centralizada
    const authResult = await authenticateUser();
    if (authResult instanceof Response) {
      return authResult; 
    }
    const userId = authResult.id; 

    // 2. Consultar la DB
    const me = await db.user.findUnique({
      where: { id: userId },
      include: { favouriteVendors: true },
    });
    
    // Si el usuario no existe en tu DB (debería existir si la auth pasó), devolvemos un array vacío o un error
    if (!me) {
         return new Response(JSON.stringify({ favouriteVendors: [] }), {
            status: 200,
            headers: corsHeaders
        });
    }

    return new Response(JSON.stringify({ favouriteVendors: me.favouriteVendors }), {
        status: 200,
        headers: corsHeaders
    });

  } catch (e) {
    console.error("Error al obtener favoritos:", e);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
        status: 500,
        headers: corsHeaders
    });
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
