"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Esperamos a que el hook maneje todo
    const timeout = setTimeout(() => {
      router.replace("/");
    }, 2000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg font-semibold">Procesando autenticación...</p>
    </div>
  );
}
