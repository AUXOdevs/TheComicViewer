import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const HistorySection = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) return <Skeleton className="h-20 w-full mb-4" />;

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Historial de títulos</h2>
      <ul>
        <li>📖 Título leído 1</li>
        <li>📖 Título leído 2</li>
      </ul>
    </section>
  );
};
