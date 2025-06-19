export default function SuscritoDashboardPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Panel del Suscriptor</h1>
      <p className="text-gray-600">
        Gracias por apoyar el proyecto. Disfruta de acceso completo al contenido
        premium.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Contenido Exclusivo</h2>
          <p className="text-gray-500 text-sm">
            Accede a cómics premium y capítulos especiales.
          </p>
        </div>
        <div className="p-4 border rounded-xl shadow-sm bg-white">
          <h2 className="font-semibold mb-2">Tu Biblioteca</h2>
          <p className="text-gray-500 text-sm">
            Ve tus lecturas guardadas y continúa donde las dejaste.
          </p>
        </div>
      </div>
    </main>
  );
}
