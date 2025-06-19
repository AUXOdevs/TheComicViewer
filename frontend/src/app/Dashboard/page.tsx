"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRedirect() {
  const router = useRouter();
  const { isAuthenticated, userRole, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
      } else {
        switch (userRole) {
          case "admin":
          case "superadmin":
            router.push("/Dashboard"); // ← esto renderiza el slot @admin
            break;
          case "registrado":
            router.push("/Dashboard"); // ← esto renderiza el slot @registrado
            break;
          case "suscrito":
            router.push("/Dashboard"); // ← esto renderiza el slot @suscrito
            break;
          default:
            router.push("/");
        }
      }
    }
  }, [isAuthenticated, userRole, isLoading, router]);

  return <p>Redirigiendo al dashboard...</p>;
}
