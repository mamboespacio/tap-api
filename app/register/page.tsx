"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

export default function Page() {
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<RegisterVendorInput>({
    resolver: zodResolver(RegisterVendorSchema),
    defaultValues: {
      user: { email: "", password: "", fullName: "", dni: "" },
      vendor: { name: "", address: "", openingHours: "10:00", closingHours: "18:00" },
    },
  });

  async function onSubmit(values: RegisterVendorInput) {
    setServerError(null);

    const payload = {
      user: {
        email: values.user.email,
        password: values.user.password,
        fullName: values.user.fullName || undefined,
        dni: values.user.dni || undefined,
      },
      vendor: {
        name: values.vendor.name,
        address: values.vendor.address || undefined,
        openingHours: values.vendor.openingHours
          ? `${new Date().toISOString().slice(0, 10)}T${values.vendor.openingHours}:00.000Z`
          : undefined,
        closingHours: values.vendor.closingHours
          ? `${new Date().toISOString().slice(0, 10)}T${values.vendor.closingHours}:00.000Z`
          : undefined,
      },
    };

    const res = await fetch("/api/auth/register-vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data?.error || "Error al registrar");
      return;
    }

    reset();
    // Redirige al flujo de OAuth de Mercado Pago
    const vendorId = data?.vendor?.id;
    if (vendorId) {
      window.location.href = `/api/mercado-pago/oauth/start?vendorId=${vendorId}`;
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registro de Vendor</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos de usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Email</label>
              <input type="email" className="border rounded-lg px-3 py-2 bg-transparent" {...register("user.email")} />
              {errors.user?.email && <span className="text-sm text-red-500 mt-1">{errors.user.email.message}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Contraseña</label>
              <input type="password" className="border rounded-lg px-3 py-2 bg-transparent" {...register("user.password")} />
              {errors.user?.password && <span className="text-sm text-red-500 mt-1">{errors.user.password.message}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Nombre completo (opcional)</label>
              <input type="text" className="border rounded-lg px-3 py-2 bg-transparent" {...register("user.fullName")} />
              {errors.user?.fullName && <span className="text-sm text-red-500 mt-1">{errors.user.fullName.message}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">DNI (opcional)</label>
              <input type="text" className="border rounded-lg px-3 py-2 bg-transparent" {...register("user.dni")} />
              {errors.user?.dni && <span className="text-sm text-red-500 mt-1">{errors.user.dni.message}</span>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm mb-1">Nombre del comercio</label>
              <input type="text" className="border rounded-lg px-3 py-2 bg-transparent" placeholder="Ej: Acme Tienda" {...register("vendor.name")} />
              {errors.vendor?.name && <span className="text-sm text-red-500 mt-1">{errors.vendor.name.message}</span>}
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm mb-1">Dirección</label>
              <input type="text" className="border rounded-lg px-3 py-2 bg-transparent" placeholder="Calle 123" {...register("vendor.address")} />
              {errors.vendor?.address && <span className="text-sm text-red-500 mt-1">{errors.vendor.address.message}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Apertura</label>
              <input type="time" className="border rounded-lg px-3 py-2 bg-transparent" {...register("vendor.openingHours")} />
              {errors.vendor?.openingHours && <span className="text-sm text-red-500 mt-1">{errors.vendor.openingHours.message}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Cierre</label>
              <input type="time" className="border rounded-lg px-3 py-2 bg-transparent" {...register("vendor.closingHours")} />
              {errors.vendor?.closingHours && <span className="text-sm text-red-500 mt-1">{errors.vendor.closingHours.message}</span>}
            </div>
          </div>
        </section>

        {serverError && <div className="text-sm text-red-600">{serverError}</div>}

        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-full bg-green-700 text-white shadow disabled:opacity-60">
          {isSubmitting ? "Registrando…" : "Crear cuenta y comercio"}
        </button>
      </form>
    </div>
  );
}
