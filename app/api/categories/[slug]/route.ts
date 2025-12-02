// app/api/categories/[slug]/route.ts

// Forzamos el runtime a Node.js para compatibilidad con Prisma
export const runtime = 'nodejs';

import db from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
// Importamos los headers CORS centralizados para consistencia
import { corsHeaders } from '@/lib/authHelper'; 

// Definimos la interfaz que Next.js espera para el contexto de la ruta dinámica
interface RouteContext {
  params: {
    slug: string; // El slug de la URL
  };
}

// ✅ La firma de la función GET debe recibir el contexto como segundo argumento
export async function GET(req: NextRequest, context: RouteContext) {
  // ✅ Accedemos directamente a params.slug, sin usar 'await'
  const { slug } = context.params; 

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
       notFound(); // notFound() de Next.js gestiona la respuesta 404
    }

    return new Response(JSON.stringify(category), {
      status: 200,
      headers: corsHeaders, // Usamos headers centralizados
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
    headers: corsHeaders, // Usamos headers centralizados
  });
}
