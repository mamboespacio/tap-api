import { withAuth } from "@/lib/withAuth";
import db from '@/lib/prisma';


export const GET = withAuth(async (user, _req) => {
  const dbUser = await db.user.findUnique({
    where: { id: user.id }, // <--- usás user.id que te pasa withAuth
    include: {
      favouriteVendors: true,
      orders: true,
      addresses: true,
      cards: true,
    },
  });

  if (!dbUser) {
    return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});
