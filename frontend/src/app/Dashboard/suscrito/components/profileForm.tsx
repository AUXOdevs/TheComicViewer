"use client";
export const ProfileForm = () => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="font-bold mb-2">Perfil</h2>
    <form className="space-y-2">
      <input className="border p-2 rounded w-full" placeholder="Nombre" />
      <input className="border p-2 rounded w-full" placeholder="Email" />
      <button className="bg-green-500 text-white p-2 rounded">Guardar</button>
    </form>
  </div>
);
