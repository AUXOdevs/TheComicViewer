import { AuthGuard } from "@/Components/protectedRoute";
import { UserManagement } from "./components/usersTable";
import { TitleManagement } from "./components/titlesTable"; 
import { SubscriptionManagement } from "./components/subscriptionsTable";
import { AdminProfile } from "./components/profileForm";

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={["admin", "superadmin"]}>
      <div className="space-y-6">
        <UserManagement isLoading={false} />
        <TitleManagement isLoading={false} />
        <SubscriptionManagement isLoading={false} />
        <AdminProfile isLoading={false} />
      </div>
    </AuthGuard>
  );
}
