// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?returnTo=${encodeURIComponent("/dashboard")}`);
  }
  const ownerId = Number(session.user.id);

  const vendors = await db.vendor.findMany({
    where: { ownerId },
    include: {
      mpAccount: true, // ajustá si tu relación se llama distinto
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm opacity-70">
            Hola {session.user.name ?? session.user.email}. Gestioná tu comercio.
          </p>
        </div>
        <Link href="/api/auth/signout" className="text-sm underline">
          Cerrar sesión
        </Link>
      </header>

      {vendors.length === 0 ? (
        <EmptyState />
      ) : (
        <VendorsList vendors={vendors} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border p-8 text-center">
      <h2 className="text-lg font-medium">Aún no tenés comercios</h2>
      <p className="mt-2 text-sm opacity-70">Creá tu comercio para empezar.</p>
      <div className="mt-6">
        <Link href="/register" className="px-4 py-2 rounded-full bg-green-700 text-white">
          Crear comercio
        </Link>
      </div>
    </div>
  );
}

type VendorsListProps = {
  vendors: Array<{
    id: number;
    name: string;
    address: string | null;
    openingHours: Date | null;
    closingHours: Date | null;
    mpAccount: {
      mpUserId: string;
      liveMode: boolean;
      tokenExpiresAt: Date | null;
    } | null;
  }>;
};

function VendorsList({ vendors }: VendorsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {vendors.map((v) => (
        <div key={v.id} className="rounded-2xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{v.name}</h3>
            <span className="text-xs rounded-full border px-2 py-1">ID #{v.id}</span>
          </div>

          {v.address && <p className="text-sm opacity-80">{v.address}</p>}

          <section className="space-y-2">
            <h4 className="text-sm font-medium">Mercado Pago</h4>
            {v.mpAccount ? (
              <div className="rounded-lg border p-3">
                <p className="text-sm">
                  Vinculado a <span className="font-mono">{v.mpAccount.mpUserId}</span>{" "}
                  {v.mpAccount.liveMode ? "(live)" : "(sandbox)"}.
                </p>
                {v.mpAccount.tokenExpiresAt && (
                  <p className="text-xs opacity-70">
                    Token vence: {v.mpAccount.tokenExpiresAt.toLocaleString("es-AR")}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/api/mercado-pago/oauth/start?vendorId=${v.id}`}
                    className="px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10"
                  >
                    Re-vincular
                  </Link>
                  <Link
                    href={`/payments/settings?v=${v.id}`}
                    className="px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10"
                  >
                    Configurar pagos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-3">
                <p className="text-sm">No vinculado.</p>
                <Link
                  href={`/api/mercado-pago/oauth/start?vendorId=${v.id}`}
                  className="mt-2 inline-flex px-3 py-1.5 rounded-full bg-green-700 text-white text-sm"
                >
                  Conectar con Mercado Pago
                </Link>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">Acciones rápidas</h4>
            <div className="flex flex-wrap gap-2">
              <Link href={`/products/new`} className="px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10">
                Nuevo producto
              </Link>
              <Link href={`/vendors/${v.id}/products`} className="px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10">
                Ver productos
              </Link>
              <Link href={`/vendors/${v.id}/orders`} className="px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10">
                Ver pedidos
              </Link>
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
