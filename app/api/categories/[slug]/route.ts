// app/api/categories/[slug]/route.ts (Versión Limpia)

export const runtime = 'nodejs';

import db from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/authHelper'; 

// SIN interfaz RouteContext personalizada

export async function GET(
  req: NextRequest, 
  // Usa el tipado estándar y simple que Next.js espera:
  { params }: { params: { slug: string } } 
) {
  const { slug } = params; // Sin 'await' aquí

  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        products: {
          include: { vendor: true },
        },
      },
    });

    if (!category) {
       notFound(); 
    }

    return new Response(JSON.stringify(category), {
      status: 200,
      headers: corsHeaders, 
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders, 
  });
}
