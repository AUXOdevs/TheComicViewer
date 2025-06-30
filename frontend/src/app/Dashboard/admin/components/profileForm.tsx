import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export const AdminProfile = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-40 w-full mb-4" />;
  }

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Mi Perfil</h2>
      <p>📧 Email: admin@correo.com</p>
      <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded">
        Editar Perfil
      </button>
    </section>
  );
};
