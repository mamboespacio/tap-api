import { z } from 'zod';
import db from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const schema = z.object({
  name: z.string().min(1),
  fullAddress: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export async function GET() {
  try {
    const vendors = await db.address.findMany({
      orderBy: { name: 'asc' },
    });

    return new Response(JSON.stringify(vendors), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al obtener addresses:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    const userId = decoded.sub;
    if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 });

    const body = await req.json();
    const { name, fullAddress, latitude, longitude } = schema.parse(body);

    const address = await db.address.create({
      data: { name, fullAddress, latitude, longitude, userId: userId }, // ajustá tipo si es string
    });

    return Response.json({ address }, { status: 201 });
  } catch (err: any) {
    console.error('Create address error:', err);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
