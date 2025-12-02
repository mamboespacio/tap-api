// app/api/orders/create/route.ts

export const runtime = 'nodejs'; 

import { NextResponse } from 'next/server';
import { corsHeaders, authenticateUser } from '@/lib/authHelper';
import db from '@/lib/prisma';

export async function POST(req: Request) {
  
  // 1. Autenticar al usuario que está creando la orden
  const authResult = await authenticateUser();
  if (authResult instanceof Response) {
    return authResult; // Devuelve 401 si falla
  }
  const user = authResult; // Este es el comprador autenticado

  const { vendorId, items } = await req.json();

  try {

    const newOrder = await db.order.create({
      data: {
        userId: user.id,
        vendorId: Number(vendorId),
        price: items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0),
        status: "PENDING",
        products: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }
    });
    
    return NextResponse.json(
        { success: true, message: "Operación completada con token válido", userId: user.id },
        { status: 201, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Error en app/api/orders/create:", error);
    return NextResponse.json(
        { error: error.message || "Error interno del servidor" },
        { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders, 
  });
}
