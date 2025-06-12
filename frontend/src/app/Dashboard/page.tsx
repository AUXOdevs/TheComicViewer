"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRedirect() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    } else {
      router.push(`/dashboard/${role}`);
    }
  }, [role, isAuthenticated, router]);

  return <div className="p-6">Cargando dashboard...</div>;
}
