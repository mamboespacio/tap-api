// src/app/dashboard-vendor/page.tsx (Server Component)

import OrderList from "@/components/OrdersList";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server"; // Tu cliente de servidor personalizado
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function VendorDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirigir si no está logueado (puedes usar redirect() de next/navigation si prefieres)
    return <p>Por favor, inicia sesión para ver el dashboard.</p>;
  }

  // Cargar datos del Vendor y si tiene cuenta de MP asociada
  const vendor = await prisma.vendor.findFirst({
    where: { ownerId: user.id },
    include: { mpAccount: true }, // Incluir la cuenta de Mercado Pago asociada
  });

  if (!vendor) {
    return <p>Perfil de vendedor no encontrado.</p>;
  }

  // Obtener las órdenes del vendedor, incluyendo detalles del usuario y productos
  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    include: {
      user: { select: { fullName: true, email: true } },
      products: {
        include: { product: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Dashboard de {vendor.name}</h1>
      <p>Bienvenido, {user.email}.</p>

      <section className="mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Integración con Mercado Pago</h2>
        
        {vendor.mpAccount ? (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
            <p className="font-bold">¡Conectado con Mercado Pago!</p>
            <p>ID de usuario de MP: {vendor.mpAccount.mpUserId}</p>
          </div>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
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
