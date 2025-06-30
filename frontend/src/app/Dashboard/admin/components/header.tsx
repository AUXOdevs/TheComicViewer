"use client";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="text-lg font-semibold">Panel de Administrador</div>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-500 hover:text-gray-700">
          <i className="fas fa-bell"></i>
          <span className="absolute top-0 right-0 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-800">
            AD
          </div>
          <span className="text-gray-700 text-sm">Admin</span>
        </div>
      </div>
    </header>
  );
}
