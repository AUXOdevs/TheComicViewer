"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const AuthGuard = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const router = useRouter();
console.log("Rol actual:", userRole)
  useEffect(() => {
    // Esperar mientras se carga
    console.log("Rol actual:", userRole);
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/");
      } else if (userRole && !allowedRoles.includes(userRole)) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, userRole, isLoading, router, allowedRoles]);

  if (isLoading || !userRole) {
    return <p className="p-4 text-center">🔄 Cargando dashboard...</p>;
  }

  if (!isAuthenticated || !allowedRoles.includes(userRole)) {
    return null; // Evita parpadeo del contenido
  }

  return <>{children}</>;
};
