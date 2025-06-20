import { AuthGuard } from "@/Components/protectedRoute";

export default function RegistradoDashboardPage() {
  return (
    <AuthGuard allowedRoles={["registrado"]}>
      <h1 className="text-2xl font-bold">Dashboard Registrado</h1>
      <p>Bienvenido al dashboard de usuarios registrados.</p>
    </AuthGuard>
  );
}
