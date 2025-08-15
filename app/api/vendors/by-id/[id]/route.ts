import db from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();
  const psrsedId = id ? parseInt(id, 10) : undefined;

  if (!psrsedId || isNaN(psrsedId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: psrsedId },
      include: {
        products: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!vendor) {
      return new Response('Vendor no encontrado', { status: 404 });
    }
    return new Response(JSON.stringify(vendor), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
