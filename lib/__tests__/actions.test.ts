import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderStatus } from "@prisma/client";

// Hoist mock fns before vi.mock factories run
const mockGetUser = vi.hoisted(() => vi.fn());
const mockDb = vi.hoisted(() => ({
  profile: { findUnique: vi.fn() },
  product: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  vendor: { findFirst: vi.fn() },
  order: { findUnique: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));
vi.mock("@/lib/prisma", () => ({ default: mockDb }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createProductAction } from "@/app/dashboard/products/actions";
import { updateOrderStatusAction } from "@/app/actions";

// ─── helpers ───────────────────────────────────────────────────────────────

function asAuthenticated(userId = "user-1") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function asVendorProfile(vendorId = 1) {
  mockDb.profile.findUnique.mockResolvedValue({
    role: "VENDOR",
    vendors_owned: [{ id: vendorId }],
  });
}

const baseProduct = {
  id: 0,
  name: "Producto Test",
  price: 10,
  stock: 5,
  categoryId: 1,
};

// ─── createProductAction ────────────────────────────────────────────────────

describe("createProductAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createProductAction(baseProduct)).rejects.toThrow("No autenticado.");
  });

  it("throws when user is not a VENDOR", async () => {
    asAuthenticated();
    mockDb.profile.findUnique.mockResolvedValue({ role: "CUSTOMER", vendors_owned: [] });
    await expect(createProductAction(baseProduct)).rejects.toThrow("Acceso denegado.");
  });

  it("throws on IDOR: productId owned by a different vendor", async () => {
    asAuthenticated();
    asVendorProfile(1);
    // product 999 does NOT belong to vendor 1
    mockDb.product.findFirst.mockResolvedValue(null);

    await expect(
      createProductAction({ ...baseProduct, id: 999 })
    ).rejects.toThrow("Producto no encontrado o sin permiso.");

    expect(mockDb.product.findFirst).toHaveBeenCalledWith({
      where: { id: 999, vendor_id: 1 },
    });
  });

  it("creates a new product when id is 0", async () => {
    asAuthenticated();
    asVendorProfile(1);
    const created = { id: 10, name: "Producto Test", vendor_id: 1 };
    mockDb.product.create.mockResolvedValue(created);

    const result = await createProductAction({ ...baseProduct, id: 0 });

    expect(mockDb.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Producto Test", vendor_id: 1 }),
      })
    );
    expect(result).toEqual(created);
  });

  it("updates an owned product when id > 0", async () => {
    asAuthenticated();
    asVendorProfile(1);
    const existing = { id: 5, vendor_id: 1, name: "old" };
    const updated = { ...existing, name: "Producto Test" };
    mockDb.product.findFirst.mockResolvedValue(existing);
    mockDb.product.update.mockResolvedValue(updated);

    const result = await createProductAction({ ...baseProduct, id: 5 });

    expect(mockDb.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    );
    expect(result).toEqual(updated);
  });
});

// ─── updateOrderStatusAction ────────────────────────────────────────────────

describe("updateOrderStatusAction — state machine", () => {
  beforeEach(() => vi.clearAllMocks());

  function asOrder(status: OrderStatus) {
    mockDb.order.findUnique.mockResolvedValue({
      id: 1,
      vendor_id: 10,
      status,
      products: [{ product_id: 5, quantity: 2 }],
    });
    mockDb.vendor.findFirst.mockResolvedValue({ id: 10 }); // isOwner
  }

  it("throws when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(
      updateOrderStatusAction({ orderId: 1, status: OrderStatus.APPROVED })
    ).rejects.toThrow("No autenticado.");
  });

  it("blocks APPROVED → PENDING (invalid downgrade)", async () => {
    asAuthenticated();
    asOrder(OrderStatus.APPROVED);
    await expect(
      updateOrderStatusAction({ orderId: 1, status: OrderStatus.PENDING })
    ).rejects.toThrow("Transición inválida");
  });

  it("blocks CANCELLED → APPROVED (terminal state)", async () => {
    asAuthenticated();
    asOrder(OrderStatus.CANCELLED);
    await expect(
      updateOrderStatusAction({ orderId: 1, status: OrderStatus.APPROVED })
    ).rejects.toThrow("Transición inválida");
  });

  it("blocks REJECTED → CANCELLED (terminal state)", async () => {
    asAuthenticated();
    asOrder(OrderStatus.REJECTED);
    await expect(
      updateOrderStatusAction({ orderId: 1, status: OrderStatus.CANCELLED })
    ).rejects.toThrow("Transición inválida");
  });

  it("allows PENDING → APPROVED without touching stock", async () => {
    asAuthenticated();
    asOrder(OrderStatus.PENDING);
    mockDb.order.update.mockResolvedValue({});

    await updateOrderStatusAction({ orderId: 1, status: OrderStatus.APPROVED });

    expect(mockDb.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: OrderStatus.APPROVED } })
    );
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("allows APPROVED → CANCELLED and restores stock in a transaction", async () => {
    asAuthenticated();
    asOrder(OrderStatus.APPROVED);

    const txProduct = { update: vi.fn() };
    const txOrder = { update: vi.fn() };
    mockDb.$transaction.mockImplementation(async (fn: any) =>
      fn({ product: txProduct, order: txOrder })
    );

    await updateOrderStatusAction({ orderId: 1, status: OrderStatus.CANCELLED });

    expect(mockDb.$transaction).toHaveBeenCalled();
    expect(txProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: { stock: { increment: 2 } },
      })
    );
    expect(txOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: OrderStatus.CANCELLED } })
    );
  });

  it("allows PENDING → CANCELLED and restores stock in a transaction", async () => {
    asAuthenticated();
    asOrder(OrderStatus.PENDING);

    const txProduct = { update: vi.fn() };
    const txOrder = { update: vi.fn() };
    mockDb.$transaction.mockImplementation(async (fn: any) =>
      fn({ product: txProduct, order: txOrder })
    );

    await updateOrderStatusAction({ orderId: 1, status: OrderStatus.CANCELLED });

    expect(mockDb.$transaction).toHaveBeenCalled();
    expect(txProduct.update).toHaveBeenCalled();
  });
});
