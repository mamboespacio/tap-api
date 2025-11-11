"use client";

import { usePathname } from "next/navigation";
import { SidebarWithHeader, type NavItem } from "@/components/SidebarWithHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    { name: "Inicio", href: "/dashboard", current: pathname === "/" },
    { name: "Productos", href: "/products", current: pathname.startsWith("/projects") },
    { name: "Puntos de venta", href: "/pos", current: pathname.startsWith("/team") },
  ];

  return (
    <SidebarWithHeader brand={{ name: "Mi App" }} nav={nav}>
      {children}
    </SidebarWithHeader>
  );
}
