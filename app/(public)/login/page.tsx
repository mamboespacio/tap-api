// src/app/login/page.tsx
"use client";

import { Suspense } from 'react';
import { useLoginForm } from "@/hooks/use-login-form"; // Importamos el nuevo hook

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Iniciar Sesión</h1>
      <Suspense fallback={<div>Cargando formulario de login...</div>}></Suspense>
      <p className="text-sm">
        ¿No tenés cuenta?{" "}
        <a className="underline" href="/register">
          Crear cuenta
        </a>
      </p>
    </div>
  );
}