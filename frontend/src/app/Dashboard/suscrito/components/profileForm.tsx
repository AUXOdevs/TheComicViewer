import { Skeleton } from "@/app/Dashboard/skeletonDasboard";

export function ProfileForm({  isLoading = false }) {
  if (isLoading) return <Skeleton className="h-32 w-full rounded-lg" />;

  return (
    <section className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Mi Perfil</h2>
      <p>📧 Email: admin@correo.com</p>
      <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded">
        Editar Perfil
      </button>
    </section>
  );
}
