"use client";
import { AuthGuard } from "@/Components/protectedRoute";

import { useAuth } from "@/hooks/useAuth";
import { SkeletonDashboard } from "../skeleton";
import { StatsCards } from "./components/statsCads";

export default function RegistradoDashboardPage() {
  const { profile } = useAuth();
  if (!profile) {
    return <SkeletonDashboard />;
  }

  return (
    <AuthGuard allowedRoles={["registrado"]}>
      <div className="p-4 space-y-4">
        <h1 className="t-4 text-2xl text-[#20444c] font-bold">
          ¡Bienvenido, {profile.name}!
        </h1>
        <StatsCards profile={profile} />
      </div>
    </AuthGuard>
  );
}
