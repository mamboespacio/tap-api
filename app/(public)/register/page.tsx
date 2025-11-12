// src/app/register-vendor/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
// Cliente Supabase del lado del cliente solo para el paso de registro inicial
import { createClient } from "@/lib/supabase/client"; 
// Importamos la Server Action segura
import { createVendorAction } from "@/app/actions"; 

// --- ESQUEMA ZOD (sin cambios) ---
const RegisterVendorSchema = z.object({
  user: z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    fullName: z.string().optional().or(z.literal("")),
    dni: z.string().optional().or(z.literal("")),
  }),
  vendor: z.object({
    name: z.string().min(2, "Muy corto"),
    address: z.string().optional().or(z.literal("")),
    openingHours: z.string().optional().or(z.literal("")),
    closingHours: z.string().optional().or(z.literal("")),
  }),
});

type RegisterVendorInput = z.infer<typeof RegisterVendorSchema>;

// Inicializamos el cliente de supabase del lado del cliente
const supabase = createClient();

export default function RegisterVendorPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterVendorInput>({
    resolver: zodResolver(RegisterVendorSchema),
    defaultValues: {
      user: { email: "", password: "", fullName: "", dni: "" },
      vendor: {
        name: "",
        address: "",
        openingHours: "10:00",
        closingHours: "18:00",
      },
    },
  });

  async function onSubmit(values: RegisterVendorInput) {
    setServerError(null);

    try {
      // 1️⃣ Crear usuario en Supabase Auth (Client-side)
      // Supabase se encarga de iniciar sesión automáticamente y guardar la cookie.
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.user.email,
        password: values.user.password,
        options: {
          data: {
            fullName: values.user.fullName || null,
            dni: values.user.dni || null,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // 2️⃣ Llamar a la Server Action para crear el Vendor de forma segura (Server-side)
      await createVendorAction({
        name: values.vendor.name,
        address: values.vendor.address || undefined,
        openingHours: values.vendor.openingHours || undefined,
        closingHours: values.vendor.closingHours || undefined,
      });

      // 3️⃣ Redirigir al usuario al dashboard o a donde corresponda
      reset();
      router.replace("/dashboard");
      // router.refresh() asegura que los Server Components refetcheen la data
      router.refresh(); 

    } catch (error: any) {
      // Manejar errores de signup O de la server action
      setServerError(error.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registro de Vendor</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ... (Secciones de Datos de usuario y Datos del comercio permanecen igual) ... */}
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos de usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Email" type="email" register={register("user.email")} error={errors.user?.email?.message} />
            <InputField label="Contraseña" type="password" register={register("user.password")} error={errors.user?.password?.message} />
            <InputField label="Nombre completo (opcional)" register={register("user.fullName")} error={errors.user?.fullName?.message} />
            <InputField label="DNI (opcional)" register={register("user.dni")} error={errors.user?.dni?.message} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Nombre del comercio" register={register("vendor.name")} error={errors.vendor?.name?.message} className="md:col-span-2" />
            <InputField label="Dirección" register={register("vendor.address")} error={errors.vendor?.address?.message} className="md:col-span-2" />
            <InputField label="Apertura" type="time" register={register("vendor.openingHours")} error={errors.vendor?.openingHours?.message} />
            <InputField label="Cierre" type="time" register={register("vendor.closingHours")} error={errors.vendor?.closingHours?.message} />
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

// 🧱 Subcomponente reutilizable para inputs (sin cambios)
function InputField({
  label,
  type = "text",
  register,
  error,
  className,
}: {
  label: string;
  type?: string;
  register: any;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <label className="text-sm mb-1">{label}</label>
      <input type={type} className="border rounded-lg px-3 py-2 bg-transparent" {...register} />
      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
    </div>
  );
}
