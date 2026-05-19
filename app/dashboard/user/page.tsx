import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import db from '@/lib/prisma';

export default async function UserProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth/login');

  const profile = await db.profile.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, full_name: true, dni: true, role: true, created_at: true },
  });

  if (!profile) redirect('/auth/login');

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
        <Row label="Nombre completo" value={profile.full_name ?? '—'} />
        <Row label="Email" value={profile.email} />
        <Row label="DNI" value={profile.dni ?? '—'} />
        <Row label="Rol" value={profile.role} />
        <Row
          label="Miembro desde"
          value={profile.created_at.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
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
