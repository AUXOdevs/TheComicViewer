import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const SubscriptionManagement = ({
  isLoading,
}: {
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Skeleton className="h-20 w-full mb-4" />;
  }

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Gestión de Suscripciones</h2>
      <ul className="space-y-2">
        <li>📅 Suscripción de usuario X - [Eliminar]</li>
      </ul>
    </section>
  );
};