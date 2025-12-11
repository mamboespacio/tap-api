"use client";

import { SidebarWithHeader, type NavItem } from "@/components/SidebarWithHeader";
import { useSupabaseUser } from "@/lib/useSupabaseUser";
import { ClipboardCheck, Leaf, MapPin } from "lucide-react";
import Loader from "@/components/Loader";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useSupabaseUser();


  if (!user) return <Loader />;

  const nav: NavItem[] = [
    { name: "Inicio", href: "/dashboard", current: false, icon: <Leaf/> },
    { name: "Productos", href: "/products", current: false, icon: <ClipboardCheck/> },
    { name: "Puntos de venta", href: "/pos", current: false, icon: <MapPin/> },
  ];

  return <SidebarWithHeader brand={{ name: "Take Away Please" }} nav={nav} currentUser={user}>{children}</SidebarWithHeader>;
}
