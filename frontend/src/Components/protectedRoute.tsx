"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (userRole === "admin" || userRole === "superadmin") {
        router.push("/dashboard/admin");
      } else if (userRole === "registrado") {
        router.push("/dashboard/registrado");
      } else if (userRole === "suscrito") {
        router.push("/dashboard/suscrito");
      }
    }
  }, [isAuthenticated, isLoading, userRole, router]);

  if (isLoading || !userRole) return <p>Cargando...</p>;

  return <>{children}</>;
}
