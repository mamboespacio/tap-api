"use client";

import { createClient } from "@/lib/supabase/client";

type Props = { className?: string; redirectTo?: string };

export function LogoutButton({ className, redirectTo = "/login" }: Props) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = redirectTo;
  };

  return (
    <button
      onClick={handleLogout}
      className={className ?? "px-3 py-1.5 rounded-full border text-sm hover:bg-foreground/10"}
    >
      Cerrar sesión
    </button>
  );
}
