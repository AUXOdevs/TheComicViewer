"use client";
import { AuthGuard } from "@/Components/protectedRoute";

import  Layout  from "./layout";
import { StatsCards } from "./components/statsCads";
import { HistoryList } from "./components/historyList";
import { FavoritesList } from "./components/favoritesList";
import { SubscriptionCard } from "./components/subscriptionCard";
import { ProfileForm } from "./components/profileForm";
import { SkeletonDashboard } from "./skeleton";
import { useAuth } from "@/hooks/useAuth"; 


export default function SuscritoDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <AuthGuard allowedRoles={["suscrito"]}>

      <Layout>
        <div className="space-y-4">
          <StatsCards />
          <HistoryList />
          <FavoritesList />
          <SubscriptionCard />
          <ProfileForm />
        </div>
      </Layout>

    </AuthGuard>
  );
}
