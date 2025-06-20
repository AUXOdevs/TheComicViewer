import { AuthGuard } from "@/Components/protectedRoute";

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={["admin", "superadmin"]}>
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      <p>Contenido exclusivo para administradores.</p>
    </AuthGuard>
  );
}
