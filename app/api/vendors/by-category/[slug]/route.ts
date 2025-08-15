// app/api/vendors/[slug]/route.ts
import db from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.pathname.split('/').pop();
  try {
    const vendors = await db.vendor.findMany({
      where: {
        products: {
          some: {
            category: {
              slug: slug,
            },
          },
        },
      },
      include: {
        products: {
          where: {
            category: {
              slug: slug,
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(vendors), {
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
