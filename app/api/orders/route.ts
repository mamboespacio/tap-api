import db from '@/lib/prisma';
import { getToken } from '@/lib/getToken';

export async function POST(req: Request) {
  try {
    const authResult = getToken(req);
    if ('error' in authResult) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const userId = authResult.user.id;
    const body = await req.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: 'Lista de productos vacía o mal formada' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Obtener vendorId desde el primer producto
    const firstProductId = products[0].productId;
    const productWithVendor = await db.product.findUnique({
      where: { id: firstProductId },
      select: { vendorId: true, price: true },
    });

    if (!productWithVendor) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
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
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
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
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }

    const orderItemsData = products.map((item: { productId: number; quantity: number }) => ({
      product: { connect: { id: item.productId } },
      quantity: item.quantity,
    }));

    const newOrder = await db.order.create({
      data: {
        price,
        condition: 'PENDING',
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
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al crear orden:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const vendors = await db.order.findMany({
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

    return new Response(JSON.stringify(vendors), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
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
