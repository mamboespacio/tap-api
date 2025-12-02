// app/api/categories/route.ts

// Forzamos el runtime a Node.js para compatibilidad con Prisma
export const runtime = 'nodejs';

import db from '@/lib/prisma';
import { NextResponse } from 'next/server';
// Importamos los headers CORS centralizados
import { corsHeaders } from '@/lib/authHelper'; 


export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return new Response(JSON.stringify(categories), {
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

// api-server/app/api/categories/route.ts
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders, // Usamos headers centralizados
  });
}