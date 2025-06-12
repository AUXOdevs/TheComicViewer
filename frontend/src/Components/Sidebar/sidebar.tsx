"use client";

import { useAuth } from "@/hooks/useAuth";
import { Home, Book, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = {
  registrado: [
    { label: "Inicio", icon: Home, href: "/dashboard/registrado" },
    {
      label: "Mis Lecturas",
      icon: Book,
      href: "/dashboard/registrado/mis-lecturas",
    },
  ],
  suscrito: [
    { label: "Inicio", icon: Home, href: "/dashboard/suscrito" },
    {
      label: "Catálogo Premium",
      icon: Book,
      href: "/dashboard/suscrito/premium",
    },
  ],
  admin: [
    { label: "Inicio", icon: Home, href: "/dashboard/admin" },
    {
      label: "Gestión de Usuarios",
      icon: Shield,
      href: "/dashboard/admin/usuarios",
    },
  ],
};

export default function Sidebar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const items = navItems[role?.toLowerCase() as keyof typeof navItems] || [];

  return (
    <aside className="w-64 h-full bg-gray-900 text-white p-4">
      <nav className="space-y-2">
        {items.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <div
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition",
                pathname === href && "bg-gray-800 font-bold"
              )}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
