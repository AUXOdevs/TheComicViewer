export default function AdminDashboardPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <p className="text-gray-600">
        Bienvenido al panel de administración. Aquí podrás gestionar usuarios,
        contenidos y más.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-sm">
            Crear, editar o eliminar usuarios.
          </p>
        </div>
        <div className="p-4 border rounded-xl shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Moderación</h2>
          <p className="text-gray-500 text-sm">
            Revisar reportes y gestionar contenido.
          </p>
        </div>
      </div>
    </main>
  );
}
