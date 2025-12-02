// app/api/vendor/products/[id]/route.ts

import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función auxiliar para verificar propiedad y autenticación
async function verifyVendorOwnership(userId: string | undefined, productId: string) {
    if (!userId) return false;
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    return product?.vendorId === userId;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  const productId = params.id;

  if (!await verifyVendorOwnership(user?.id, productId)) {
    return new NextResponse('Unauthorized or Access Denied', { status: 403 });
  }

  const { name, description, price } = await req.json();

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price),
      },
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return new NextResponse('Error updating product', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  const productId = params.id;

  if (!await verifyVendorOwnership(user?.id, productId)) {
    return new NextResponse('Unauthorized or Access Denied', { status: 403 });
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error deleting product', { status: 500 });
  }
}
