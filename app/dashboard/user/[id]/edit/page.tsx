import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/prisma";
import { updateProfileAction } from "@/app/dashboard/user/actions";

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/login");

  // Only allow editing own profile
  if (params.id !== user.id) redirect("/dashboard/user");

  const profile = await db.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect("/dashboard/user");

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/user"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold">Editar perfil</h1>
      </div>

      <form action={updateProfileAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre completo
          </label>
          <input
            name="full_name"
            defaultValue={profile.full_name ?? ""}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            DNI
          </label>
          <input
            name="dni"
            defaultValue={profile.dni ?? ""}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            value={profile.email}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El email no se puede cambiar desde aquí.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Guardar cambios
          </button>
          <Link
            href="/dashboard/user"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
