import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/prisma';

export default async function VendorPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth/login');

  const vendor = await db.vendor.findFirst({
    where: { owner_id: user.id },
    include: { mp_account: true },
  });

  if (!vendor) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">No tenés un comercio registrado.</p>
      </div>
    );
  }

  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Punto de venta</h1>
        <Link
          href={`/dashboard/vendor/${vendor.id}/edit`}
          className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Editar
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
        <Row label="Nombre" value={vendor.name} />
        <Row label="Dirección" value={vendor.address} />
        <Row
          label="Horario"
          value={`${fmt(vendor.opening_hours)} — ${fmt(vendor.closing_hours)}`}
        />
        <Row
          label="Mercado Pago"
          value={
            vendor.mp_account ? (
              <span className="text-green-600 font-medium dark:text-green-400">
                Conectado · ID {vendor.mp_account.mp_profile_id}
              </span>
            ) : (
              <Link
                href={`/api/mercadopago/oauth/start?vendorId=${vendor.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Conectar cuenta
              </Link>
            )
          }
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
