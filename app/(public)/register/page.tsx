// src/app/register-vendor/page.tsx
"use client";

import { useRegisterVendor } from "@/hooks/use-register-vendor"; 
import InputField from "@/components/ui/inputField";

export default function RegisterVendorPage() {
  const { 
      register, 
      formState: { errors, isSubmitting }, 
      onSubmit, 
      serverError 
  } = useRegisterVendor();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registro de Vendor</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos de usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Email" type="email" register={register("email")} error={errors.email?.message} />
            <InputField label="Contraseña" type="password" register={register("password")} error={errors.password?.message} />
            <InputField label="Nombre completo (opcional)" register={register("fullName")} error={errors.fullName?.message} />
            <InputField label="DNI (opcional)" register={register("dni")} error={errors.dni?.message} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Nombre del comercio" register={register("vendorName")} error={errors.vendorName?.message} className="md:col-span-2" />
            <InputField label="Dirección" register={register("vendorAddress")} error={errors.vendorAddress?.message} className="md:col-span-2" />
            <InputField label="Apertura" type="time" register={register("openingHours")} error={errors.openingHours?.message} />
            <InputField label="Cierre" type="time" register={register("closingHours")} error={errors.closingHours?.message} />
          </div>
        </section>

        {serverError && <div className="text-sm text-red-600">{serverError}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-full bg-green-700 text-white shadow disabled:opacity-60"
        >
          {isSubmitting ? "Registrando…" : "Crear cuenta y comercio"}
        </button>
      </form>
    </div>
  );
}
