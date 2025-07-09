"use client";
import { useAuth } from "@/hooks/useAuth";

import { AuthGuard } from "@/Components/protectedRoute";
import Layout from "./layout";
import { StatsCards } from "./components/statsCads";
import { SkeletonDashboard } from "../skeleton";

export default function SuscritoDashboardPage() {
  const { profile } = useAuth();

  if (!profile) {
    return <SkeletonDashboard />;
  }

  return (
    <AuthGuard allowedRoles={["suscrito"]}>
      <Layout>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl text-[#20444c] font-bold">
            ¡Bienvenido, {profile.name}!
          </h1>
          <StatsCards profile={profile} />
        </div>
      </Layout>
    </AuthGuard>
  );
}
