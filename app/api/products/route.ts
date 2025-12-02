// app/api/products/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        vendor: {
          select: {
            name: true, // Solo el nombre del vendedor
          },
        },
      },
    });

    return NextResponse.json(products);

  } catch (error) {
    console.error(error);
    return new NextResponse('Error fetching products', { status: 500 });
  }
}
