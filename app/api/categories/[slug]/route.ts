import db from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

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