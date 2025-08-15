import db from '@/lib/prisma';
import { RegisterSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const { email, password } = parsed.data;
  const hash = await bcrypt.hash(password, 10);
  const user = await db.user.create({ data: { email, password: hash } });
  return NextResponse.json({ user });
}