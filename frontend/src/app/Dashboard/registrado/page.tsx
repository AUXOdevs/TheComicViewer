import { AuthGuard } from "@/Components/protectedRoute";
import { ProfileSection } from "./components/profileForm";

export default function RegistradoDashboardPage() {
  return (
    <AuthGuard allowedRoles={["registrado"]}>
      <div className="max-w-xl mx-auto space-y-6">
        <ProfileSection isLoading={false} />
      </div>
    </AuthGuard>
  );
}
