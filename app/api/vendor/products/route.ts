// app/api/vendor/products/route.ts

import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  // Inicialización del cliente SSR para Route Handlers
  const supabase = createRouteHandlerClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Opcional: Verificar que el rol sea 'vendor' si lo tienes en metadata o DB
  // const { data: profile } = await supabase.from('User').select('rol').eq('id', user.id).single();
  // if (profile?.rol !== 'vendor') { ... }

  const { name, description, price } = await req.json();

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        vendorId: user.id, // Asocia el producto al vendedor autenticado
      },
    });

    return NextResponse.json(newProduct);

  } catch (error) {
    console.error(error);
    return new NextResponse('Error creating product', { status: 500 });
  }
}
