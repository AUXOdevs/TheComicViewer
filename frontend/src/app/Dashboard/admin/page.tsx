"use client";
import { AuthGuard } from "@/Components/protectedRoute";
import { StatsCards } from "./components/statsCard";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonDashboard } from "../skeleton";

export default function AdminDashboardPage() {
  const { profile } = useAuth();

  if (!profile) {
    return <SkeletonDashboard />;
  }

  return (
    <AuthGuard allowedRoles={["admin", "superadmin"]}>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl text-[#20444c] font-bold">
            ¡Bienvenido, {profile.name}!
          </h1>
          <StatsCards profile={profile} />
        </div>
    </AuthGuard>
  );
}
