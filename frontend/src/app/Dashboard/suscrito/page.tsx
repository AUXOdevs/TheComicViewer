import { AuthGuard } from "@/Components/protectedRoute";

export default function SuscritoDashboardPage() {
  return (
    <AuthGuard allowedRoles={["suscrito"]}>
      <h1 className="text-2xl font-bold">Dashboard Suscrito</h1>
      <p>Acceso exclusivo para suscriptores premium.</p>
    </AuthGuard>
  );
}
