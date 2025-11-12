"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    // 1️⃣ Crear usuario en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
      setServerError(signUpError.message);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      setServerError("No se pudo obtener el usuario después del registro.");
      return;
    }

    // 2️⃣ Crear Vendor vinculado a este usuario
    const payload = {
      name: values.vendor.name,
      address: values.vendor.address || undefined,
      openingHours: values.vendor.openingHours
        ? `${new Date().toISOString().slice(0, 10)}T${values.vendor.openingHours}:00.000Z`
        : undefined,
      closingHours: values.vendor.closingHours
        ? `${new Date().toISOString().slice(0, 10)}T${values.vendor.closingHours}:00.000Z`
        : undefined,
      userId: user.id, // vínculo directo
    };

    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setServerError(data?.error || "Error al crear el comercio");
      return;
    }

    reset();

    // 3️⃣ Redirigir al flujo de OAuth de Mercado Pago (si aplica)
    const vendorId = data?.id;
    if (vendorId) {
      window.location.href = `/api/mercado-pago/oauth/start?vendorId=${vendorId}`;
      return;
    }

    // 4️⃣ Si no hay flujo MP, redirigir al dashboard
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registro de Vendor</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos de usuario */}
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos de usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Email" type="email" register={register("user.email")} error={errors.user?.email?.message} />
            <InputField label="Contraseña" type="password" register={register("user.password")} error={errors.user?.password?.message} />
            <InputField label="Nombre completo (opcional)" register={register("user.fullName")} error={errors.user?.fullName?.message} />
            <InputField label="DNI (opcional)" register={register("user.dni")} error={errors.user?.dni?.message} />
          </div>
        </section>

        {/* Datos del comercio */}
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

// 🧱 Subcomponente reutilizable para inputs
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
