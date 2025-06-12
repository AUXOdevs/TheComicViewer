"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const navigationByRole = {
  registrado: [
    { name: "Inicio", href: "/dashboard" },
    { name: "Explorar", href: "/dashboard/explorar" },
  ],
  suscrito: [
    { name: "Inicio", href: "/dashboard" },
    { name: "Mis favoritos", href: "/dashboard/favoritos" },
    { name: "Contenido exclusivo", href: "/dashboard/exclusivo" },
  ],
  admin: [
    { name: "Inicio", href: "/dashboard" },
    { name: "Gestión de títulos", href: "/dashboard/titulos" },
    { name: "Usuarios", href: "/dashboard/usuarios" },
    { name: "Reportes", href: "/dashboard/reportes" },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }

    if (user) {
      const rol = user?.["https://miapp.com/roles"] || user?.["role"];
      setRole(rol);
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading || !role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  const navigation =
    navigationByRole[role as keyof typeof navigationByRole] || [];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Mi Dashboard</h2>
        <nav className="flex flex-col gap-2">
          {navigation.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "px-3 py-2 rounded hover:bg-gray-700 transition"
                // Opcional: marcar la ruta activa
              )}>
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
