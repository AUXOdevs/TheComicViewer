export default function AdminView() {
  return (
    <section className="p-6 max-w-5xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Panel de Administración</h2>
      <p className="mb-4">
        Desde aquí puedes gestionar usuarios, títulos y estadísticas.
      </p>
      <div className="grid grid-cols-3 gap-4 text-left">
        <div className="bg-white rounded p-4 border shadow">
          <h3 className="font-semibold text-lg mb-2">Usuarios</h3>
          <p>Ver y modificar usuarios registrados.</p>
        </div>
        <div className="bg-white rounded p-4 border shadow">
          <h3 className="font-semibold text-lg mb-2">Títulos</h3>
          <p>Publicar, editar o eliminar cómics y mangas.</p>
        </div>
        <div className="bg-white rounded p-4 border shadow">
          <h3 className="font-semibold text-lg mb-2">Estadísticas</h3>
          <p>Ver tráfico, suscripciones y actividad.</p>
        </div>
      </div>
    </section>
  );
}
