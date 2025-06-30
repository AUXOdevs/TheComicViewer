// src/components/dashboard/admin/UserManagement.tsx
import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const UserManagement = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-20 w-full mb-4" />;
  }

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Gestión de Usuarios</h2>
      <ul className="space-y-2">
        <li>👤 Usuario 1 - [Editar] [Eliminar] [Activar]</li>
        <li>👤 Usuario 2 - [Editar] [Eliminar] [Activar]</li>
      </ul>
    </section>
  );
};
