import { AuthGuard } from "@/Components/protectedRoute";
import { SubscriptionInfo } from "./components/subscriptionCard";
import { HistorySection } from "./components/historyList";
import { FavoritesSection } from "./components/favoritesList";
import { ProfileForm } from "./components/profileForm";

export default function SuscritoDashboardPage() {
  return (
    <AuthGuard allowedRoles={["suscrito"]}>
      <div className="space-y-6">
        <SubscriptionInfo isLoading={false} />
        <HistorySection isLoading={false} />
        <FavoritesSection isLoading={false} />
        <ProfileForm />
      </div>
    </AuthGuard>
  );
}
