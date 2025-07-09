"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/Components/protectedRoute";
import { SkeletonDashboard } from "./skeleton";

import { SuscriptorSidebar } from "./suscrito/components/sidebar";
import { AdminSidebar } from "./admin/components/sidebar";
import { RegistradoSidebar } from "./registrado/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, profile, userRole, error } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading || !profile) return <SkeletonDashboard />;
  if (error)
    return (
      <div className="text-red-500 p-4">{error.message || String(error)}</div>
    );

  // Elige sidebar según rol
  const renderSidebar = () => {
    if (userRole === "suscrito") return <SuscriptorSidebar />;
    if (userRole === "admin") return <AdminSidebar />;
    if (userRole === "registrado") return <RegistradoSidebar />;
    return null;
  };

  return (
    <AuthGuard allowedRoles={["admin", "superadmin", "suscrito", "registrado"]}>
      <div className="flex flex-col md:flex-row min-h-screen bg-[#8db5ac]">
        <aside
          className={`
          fixed mt-6 top-6 bottom-0 left-0 z-40 w-64 bg-[#20444c] text-white
          transform transition-transform duration-300 ease-in-out
          -translate-x-full md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : ""}
        `}>
          {renderSidebar()}
        </aside>

        {/* Contenedor que deja espacio para sidebar en desktop */}
        <div className="flex flex-col flex-1 md:ml-64">
          {/* Header en mobile */}
          <header className="flex items-center justify-between p-4 bg-[#0f4a53] text-white md:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span className="font-semibold">TuComicViewer</span>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
