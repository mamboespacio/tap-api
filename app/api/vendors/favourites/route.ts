// /app/api/vendors/favourites/route.ts
import db from "@/lib/prisma";
import { withAuth } from "@/lib/withAuth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });

export const POST = withAuth(async (user, req) => {
  try {
    const { vendorId, action } = await req.json();

    const vendorIdNum = Number(vendorId);
    if (!Number.isFinite(vendorIdNum) || vendorIdNum <= 0) {
      return json({ error: "vendorId inválido" }, 400);
    }

    const isRemove = action === "remove";

    await db.user.update({
      where: { id: user.id }, // withAuth ya garantiza number
      data: isRemove
        ? { favouriteVendors: { disconnect: { id: vendorIdNum } } }
        : { favouriteVendors: { connect: { id: vendorIdNum } } },
    });

    // payload útil para optimistic update
    return json({ vendorId: vendorIdNum, isFavourite: !isRemove }, 200);
  } catch {
    return json({ error: "Error interno del servidor" }, 500);
  }
});

export const GET = withAuth(async (user) => {
  try {
    const userIdNum =
      typeof user.id === "number" ? user.id :
        typeof user.id === "string" ? Number(user.id) : NaN;

    if (Number.isNaN(userIdNum)) {
      return json({ error: "id de usuario inválido" }, 400);
    }

    const me = await db.user.findUnique({
      where: { id: userIdNum },
      include: { favouriteVendors: true },
    });

    return json({ favouriteVendors: me?.favouriteVendors ?? [] }, 200);
  } catch (e) {
    return json({ error: "Error interno del servidor" }, 500);
  }
});

// CORS preflight opcional
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
