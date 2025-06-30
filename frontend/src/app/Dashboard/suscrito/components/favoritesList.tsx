import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const FavoritesSection = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) return <Skeleton className="h-20 w-full mb-4" />;

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Favoritos</h2>
      <ul>
        <li>🌟 Título favorito 1</li>
        <li>🌟 Título favorito 2</li>
      </ul>
    </section>
  );
};
