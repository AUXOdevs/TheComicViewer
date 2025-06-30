import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const SubscriptionInfo = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) return <Skeleton className="h-20 w-full mb-4" />;

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Mi Suscripción</h2>
      <p>💳 Suscripción activa hasta 30/06/2025</p>
      <button className="mt-2 bg-red-600 text-white px-3 py-1 rounded">
        Cancelar Suscripción
      </button>
    </section>
  );
};
