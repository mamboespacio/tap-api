// app/api/orders/[id]/route.ts

// Aseguramos que se ejecute en entorno Node.js
export const runtime = 'nodejs'; 

import db from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
// ✅ Importamos las funciones de nuestro helper
import { corsHeaders, authenticateUser } from '@/lib/authHelper'; 

export async function GET(req: Request) {
  // 1. Verificar autenticación usando el helper centralizado
  const authResult = await authenticateUser();

  // Si authResult es una instancia de Response (es decir, falló la auth), la retornamos directamente.
  if (authResult instanceof Response) {
    return authResult; 
  }

  // Si llegamos aquí, authResult es el objeto User
  const user = authResult;

  // 2. Extraer el ID de la URL
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  const parsedId = id ? parseInt(id, 10) : NaN;

  if (isNaN(parsedId)) {
    // Usamos NextResponse.json para consistencia y aplicamos headers
    return NextResponse.json(
        { error: 'ID inválido' }, 
        { status: 400, headers: corsHeaders }
    );
  }

  try {
    // 3. Consultar la orden en la base de datos, verificando propiedad del usuario
    const order = await db.order.findUnique({
      where: { 
        id: parsedId,
        userId: user.id // Aseguramos que la orden pertenece al usuario autenticado
      },
      include: {
        products: { include: { product: true } },
        vendor: { select: { id: true, name: true, address: true, openingHours: true, closingHours: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada o no pertenece al usuario' }, 
        { status: 404, headers: corsHeaders }
      );
    }

    // 4. Devolver la orden si todo es correcto
    return NextResponse.json(order, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error al obtener orden:', error);
    return NextResponse.json(
        { error: 'Error interno del servidor' }, 
        { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS usa los headers del helper directamente
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders, 
  });
}
