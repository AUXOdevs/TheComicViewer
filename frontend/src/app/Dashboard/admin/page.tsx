"use client";
import { AuthGuard } from "@/Components/protectedRoute";
import  Layout  from "./layout";
import { UsersTable } from "./components/usersTable";
import { TitlesTable } from "./components/titlesTable";
import { SubscriptionsTable } from "./components/subscriptionsTable";
import { ProfileForm } from "./components/profileForm";
import { StatsCard } from "./components/statsCard";
import { SkeletonDashboard } from "./skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <AuthGuard allowedRoles={["admin", "superadmin"]}>
      <Layout>
        <div className="space-y-4">
          <StatsCard />
          <UsersTable isLoading={false} />
          <TitlesTable isLoading={false} />
          <SubscriptionsTable isLoading={false} />
          <ProfileForm isLoading={false} />
        </div>
      </Layout>
    </AuthGuard>
  );
}
