// src/app/dashboard-vendor/page.tsx (Server Component)

import OrderList from "@/components/OrdersList";
import { getSessionOrRedirect } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function VendorDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  const user = data.claims;

  // Cargar datos del Vendor y si tiene cuenta de MP asociada
  const vendor = await prisma.vendor.findFirst({
    where: { owner_id: user.id },
    include: { mp_account: true }, // Incluir la cuenta de Mercado Pago asociada
  });

  if (!vendor) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p className="font-bold">Perfil de vendedor no encontrado</p>
        <p>Ponte en contacto con el administrador para solucionar este problema.</p>
      </div>
    )
  }

  // Obtener las órdenes del vendedor, incluyendo detalles del usuario y productos
  const orders = await prisma.order.findMany({
    where: { vendor_id: vendor.id },
    include: {
      profile: { select: { full_name: true, email: true } },
      products: {
        include: { product: { select: { name: true } } }
      }
    },
    orderBy: { created_at: 'desc' }
  });


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Dashboard de {vendor.name}</h1>
      <p>Bienvenido, {user.email}.</p>

      <section className="mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Integración con Mercado Pago</h2>

        {vendor.mp_account ? (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg">
            <p className="font-bold">¡Conectado con Mercado Pago!</p>
            <p>ID de usuario de MP: {vendor.mp_account.mp_profile_id}</p>
          </div>
        ) : (
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
            <p className="font-bold">No conectado</p>
            <p>Conecta tu cuenta de Mercado Pago para recibir pagos por tus pedidos.</p>
            {/* El link llama a la nueva ruta de API que crearemos a continuación */}
            <Link href={`/api/mercadopago/oauth/start?vendorId=${vendor.id}`} className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Conectar Mercado Pago
            </Link>
          </div>
        )}
      </section>

      {/* Aquí iría la sección para gestionar productos (Flujo 3) */}
      <section className="mt-8">
        {/* ... */}
      </section>

      <section className="mt-8">
        <h1 className="text-2xl font-bold mb-6">Gestión de Órdenes</h1>
        <OrderList orders={orders} />
      </section>
    </div>
  );
}
