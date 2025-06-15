"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  allowedRoles: Array<"registrado" | "suscrito" | "admin">;
};

export default function RoleProtected({ children, allowedRoles }: Props) {
  const { role, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      user &&
      role &&
      !allowedRoles.includes(role as "registrado" | "suscrito" | "admin")
    ) {
      router.replace("/");
    }
  }, [user, role, allowedRoles, router]);

  if (!user || !role) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  if (!allowedRoles.includes(role as "registrado" | "suscrito" | "admin")) {
    return <div className="text-center py-10">No tienes permiso para acceder a esta página.</div>;
  }

  return <>{children}</>;
}
