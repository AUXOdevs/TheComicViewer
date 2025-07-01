"use client";
export const Sidebar = () => (
  <aside className="w-64 bg-white shadow h-full">
    <div className="p-4 text-2xl font-bold">Adiman</div>
    <nav className="flex flex-col space-y-2 p-2">
      {[
        { icon: "fa-home", label: "Dashboard" },
        { icon: "fa-clock", label: "Historial" },
        { icon: "fa-heart", label: "Favoritos" },
        { icon: "fa-credit-card", label: "Suscripción" },
        { icon: "fa-user", label: "Perfil" },
      ].map(({ icon, label }) => (
        <div
          key={label}
          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
          <i className={`fas ${icon}`}></i>
          <span>{label}</span>
        </div>
      ))}
    </nav>
  </aside>
);
