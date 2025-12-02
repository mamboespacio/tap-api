// app/api/orders/route.ts

// Forzamos el runtime a Node.js para compatibilidad con Supabase SSR y Prisma
export const runtime = 'nodejs';

import db from '@/lib/prisma';
// Importamos el helper de autenticación y los headers CORS centralizados
import { authenticateUser, corsHeaders } from '@/lib/authHelper'; 


export async function POST(req: Request) {
  try {
    // 1. Autenticación centralizada
    const authResult = await authenticateUser();
    if (authResult instanceof Response) {
      // Si el helper devuelve un Response (error 401), lo retornamos
      return authResult;
    }
    // Si la autenticación fue exitosa, tenemos el user object
    const userId = authResult.id; 

    const body = await req.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: 'Lista de productos vacía o mal formada' }), {
        status: 400,
        headers: corsHeaders, // Usamos headers centralizados
      });
    }

    // Obtener vendorId desde el primer producto
    // Nota: Es mejor validar que products[0] exista antes de acceder a products[0].productId
    const firstProductId = products[0]?.productId;
    
    if (!firstProductId) {
        return new Response(JSON.stringify({ error: 'El primer producto no tiene ID' }), {
            status: 400,
            headers: corsHeaders,
        });
    }

    const productWithVendor = await db.product.findUnique({
      where: { id: firstProductId },
      select: { vendorId: true, price: true },
    });

    if (!productWithVendor) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: corsHeaders, // Usamos headers centralizados
      });
    }

    const vendorId = productWithVendor.vendorId;

    // Validar productos existentes y calcular precio total
    const productIds = products.map((p: { productId: number }) => p.productId);
    const foundProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });

    if (foundProducts.length !== productIds.length) {
      return new Response(JSON.stringify({ error: 'Uno o más productos no existen' }), {
        status: 404,
        headers: corsHeaders, // Usamos headers centralizados
      });
    }

    // Calcular precio total
    const productPriceMap = Object.fromEntries(
      foundProducts.map(p => [p.id, p.price])
    );

    const price = products.reduce((acc: number, item: { productId: number; quantity: number }) => {
      const unitPrice = productPriceMap[item.productId] || 0;
      return acc + unitPrice * item.quantity;
    }, 0);

    if (price <= 0) {
      return new Response(JSON.stringify({ error: 'El precio total debe ser mayor a cero' }), {
        status: 400,
        headers: corsHeaders, // Usamos headers centralizados
      });
    }

    const orderItemsData = products.map((item: { productId: number; quantity: number }) => ({
      product: { connect: { id: item.productId } },
      quantity: item.quantity,
    }));

    const newOrder = await db.order.create({
      data: {
        price,
        status: 'PENDING',
        user: { connect: { id: userId } },
        vendor: { connect: { id: vendorId } },
        products: { create: orderItemsData },
      },
      include: {
        vendor: true,
        products: { include: { product: true } },
      },
    });
    return new Response(JSON.stringify(newOrder), {
      status: 201,
      headers: corsHeaders, // Usamos headers centralizados
    });
  } catch (error) {
    console.error('Error al crear orden:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export async function GET() {
  try {
    const orders = await db.order.findMany({ // Cambiado vendors a orders
      orderBy: { id: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            address: true,
            openingHours: true,
            closingHours: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: corsHeaders, // Usamos headers centralizados
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders, // Usamos headers centralizados
  });
}
