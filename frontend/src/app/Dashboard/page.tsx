"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";


export default function DashboardRedirect() {
  const router = useRouter();
  const { isAuthenticated, userRole, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; 

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (userRole) {
      switch (userRole) {
        case "admin":
        case "superadmin":
          router.replace("/Dashboard/admin");
          break;
        case "registrado":
          router.replace("/Dashboard/registrado");
          break;
        case "suscrito":
          router.replace("/Dashboard/suscrito");
          break;
        default:
          router.replace("/");
      }
    }
  }, [isAuthenticated, userRole, isLoading, router]);

  return (
    <div className="p-4 space-y-2">
      
    </div>
  );
}
