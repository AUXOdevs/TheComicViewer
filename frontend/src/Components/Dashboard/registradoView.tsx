export default function RegistradoView() {
  return (
    <section className="p-6 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">
        ¡Bienvenido, lector registrado!
      </h2>
      <p className="mb-4">
        Tienes acceso a contenido gratuito. Suscríbete para desbloquear más
        contenido.
      </p>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        Suscribirme
      </button>
    </section>
  );
}
