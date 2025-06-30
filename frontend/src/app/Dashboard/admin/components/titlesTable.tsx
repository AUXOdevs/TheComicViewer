import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const TitleManagement = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-20 w-full mb-4" />;
  }

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Gestión de Títulos</h2>
      <button className="bg-blue-600 text-white px-3 py-1 rounded">
        Nuevo título
      </button>
      <ul className="mt-2 space-y-2">
        <li>📚 Título 1 - [Editar] [Eliminar]</li>
      </ul>
    </section>
  );
};