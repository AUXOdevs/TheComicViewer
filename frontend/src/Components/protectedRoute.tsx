"use client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Si quieres proteger por rol también
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login"); // Redirigir si no ha iniciado sesión
      } else if (requiredRole && userRole !== requiredRole) {
        router.push("/unauthorized"); // Redirigir si no tiene el rol necesario
      }
    }
  }, [isAuthenticated, isLoading, userRole, requiredRole, router]);

  if (isLoading || (requiredRole && userRole === null)) return <p>Cargando...</p>;

  return <>{children}</>;
}
