import db from '@/lib/prisma';

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, categoryId, vendorId } = body;

    if (!name || !price || !categoryId || !vendorId) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    if (typeof price !== 'number' || price <= 0) {
      return new Response(JSON.stringify({ error: 'El precio debe ser un número positivo' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Verificar existencia de categoría
    const categoryExists = await db.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return new Response(JSON.stringify({ error: 'Categoría no encontrada' }), {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Verificar existencia de vendor
    const vendorExists = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendorExists) {
      return new Response(JSON.stringify({ error: 'Vendor no encontrado' }), {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const newProduct = await db.product.create({
      data: {
        name,
        // description,
        price,
        category: { connect: { id: categoryId } },
        vendor: { connect: { id: vendorId } },
      },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    return new Response(JSON.stringify(newProduct), {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
