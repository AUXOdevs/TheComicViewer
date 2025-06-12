export default function SuscritoView() {
  return (
    <section className="p-6 max-w-4xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">¡Hola, suscriptor premium!</h2>
      <p className="mb-4">
        Tienes acceso completo a todos los títulos y contenido exclusivo.
      </p>
      {/* Aquí podrías renderizar una lista de cómics/mangas premium */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded p-4 shadow">Manga Premium 1</div>
        <div className="bg-gray-100 rounded p-4 shadow">Comic Exclusivo 2</div>
      </div>
    </section>
  );
}
