"use client";
import { AuthGuard } from "@/Components/protectedRoute";
import  Layout  from "./layout";
import { ProfileForm } from "./components/profileForm";
import { SkeletonDashboard } from "./skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function RegistradoDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <AuthGuard allowedRoles={["registrado"]}>
      <Layout>
        <div className="space-y-4">
          <ProfileForm />
        </div>
      </Layout>
    </AuthGuard>
  );
}
