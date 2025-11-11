import { z } from 'zod';
import db from '@/lib/prisma';
import { getToken } from '@/lib/getToken';

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  categoryId: z.coerce.number().int().positive(),
  imageUrl: z.string().url(),
  active: z.boolean(),
  // vendorId: z.union([z.string(), z.number()]).optional(), // ← solo si querés aceptarlo opcional
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });

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
  console.log('Auth:', req.headers.get('authorization'));

  try {
    // 1) Auth
    const auth = getToken(req);
    if ('error' in auth) return json({ error: auth.error }, 401);
    // tu user id es Int
    const userId = Number(auth.user.id);

    // 2) Validación de payload
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Payload inválido', details: parsed.error.flatten() }, 400);
    }

    const { name, description, price, stock, categoryId, imageUrl, active } = parsed.data;
    const categoryIdNum = Number(categoryId);

    // 3) Resolver vendorId en el servidor
    // Un vendor por owner
    let vendor = await db.vendor.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    // Previene que un user que no tenga Vendor cree un producto
    if (!vendor) return json({ error: 'No tenés un vendor asociado.' }, 403);

    // OPCIONAL multi Vendor: permitir vendorId pero validarlo contra el owner
    // if (parsed.data.vendorId != null) {
    //   const candidate = await db.vendor.findFirst({
    //     where: { id: Number(parsed.data.vendorId), ownerId: userId },
    //     select: { id: true },
    //   });
    //   if (!candidate) return json({ error: 'Vendor inválido para este usuario.' }, 403);
    //   vendor = candidate;
    // }

    // 4) Crear producto
    const product = await db.product.create({
      data: {
        name,
        description,
        price, // si tu schema usa Decimal y preferís: new Prisma.Decimal(price)
        stock,
        active,
        categoryId: categoryIdNum,
        vendorId: vendor.id,
        imageUrl,
      },
    });

    return json(product, 201);
  } catch (e: any) {
    console.error('POST /api/products error:', e);
    return json({ error: e?.message ?? 'Error' }, 400);
  }
}
