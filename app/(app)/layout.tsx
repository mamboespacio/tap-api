"use client";

import { SidebarWithHeader, type NavItem } from "@/components/SidebarWithHeader";
import { useSupabaseUser } from "@/lib/useSupabaseUser";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useSupabaseUser();

  if (!user) return <div>Cargando...</div>;

  const nav: NavItem[] = [
    { name: "Inicio", href: "/dashboard", current: false },
    { name: "Productos", href: "/products", current: false },
    { name: "Puntos de venta", href: "/pos", current: false },
  ];

  return <SidebarWithHeader brand={{ name: "Mi App" }} nav={nav}>{children}</SidebarWithHeader>;
}
