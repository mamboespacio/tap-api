import "server-only";
import db from "@/lib/prisma";

/** Roles de ejemplo: ajustá a tu modelo real */
export type Role = "ADMIN" | "VENDOR";

export type Ctx = {
  userId: number;
  role: Role;
  /** Presente cuando el usuario está asociado a un vendor */
  vendorId?: number;
};

type ListOpts = {
  page?: number;
  q?: string;
  /** Solo ADMIN/STAFF pueden forzar este filtro. VENDOR usa su propio vendorId del ctx. */
  vendorId?: number;
  take?: number; // por si querés sobreescribir el tamaño de página
};

/**
 * Listado de productos (paginado + búsqueda + filtro por vendor).
 * - VENDOR: solo ve sus productos (ctx.vendorId).
 * - ADMIN/STAFF: pueden ver todos o filtrar por cualquier vendorId.
 */
export async function getProducts(
  ctx: Ctx,
  { page = 1, q = "", vendorId, take = 20 }: ListOpts = {}
) {
  const effectiveVendorId =
    ctx.role === "VENDOR" ? ctx.vendorId : vendorId ?? undefined;

  const where = {
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(effectiveVendorId ? { vendorId: effectiveVendorId } : {}),
  };

  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      // include: { vendor: true } // <- si querés datos del vendor
    }),
    db.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / take)),
    pageSize: take,
  };
}

/**
 * Detalle de un producto por ID.
 * - VENDOR: solo puede leer productos de su vendorId.
 * - ADMIN/STAFF: pueden leer cualquier producto.
 */
export async function getProductById(ctx: Ctx, id: number) {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return null;

  if (ctx.role === "VENDOR") {
    if (!ctx.vendorId || product.vendorId !== ctx.vendorId) {
      throw new Error("Forbidden");
    }
  }
  return product;
}

/**
 * Varios productos por una lista de IDs.
 * - VENDOR: solo recibe los que pertenezcan a su vendorId.
 * - ADMIN/STAFF: reciben todos los IDs solicitados que existan.
 */
export async function getProductsByIds(ctx: Ctx, ids: number[]) {
  if (!ids?.length) return [];

  const whereBase = { id: { in: ids } as const };

  const where =
    ctx.role === "VENDOR" && ctx.vendorId
      ? { ...whereBase, vendorId: ctx.vendorId }
      : whereBase;

  const items = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return items;
}
