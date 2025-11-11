// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

type Props = { className?: string; redirectTo?: string };

export function LogoutButton({ className, redirectTo = "/login" }: Props) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: redirectTo })}
      className={className ?? "px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10"}
    >
      Cerrar sesión
    </button>
  );
}
