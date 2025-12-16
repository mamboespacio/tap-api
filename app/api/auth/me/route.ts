export const runtime = 'nodejs';

import { NextRequest, NextResponse, } from 'next/server';
import db from '@/lib/prisma';
import { authenticateUser, corsHeaders } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  const authResult = await authenticateUser(req);
  if (authResult instanceof Response) return authResult;

  const user = authResult;

  try {
    const profile = await db.profile.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, full_name: true },
    });

    return NextResponse.json({ user: profile ?? user }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Error al obtener perfil del usuario:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
