"use client";
export const StatsCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { value: "12", label: "Historial", icon: "fa-clock" },
      { value: "5", label: "Favoritos", icon: "fa-heart" },
      { value: "Activa", label: "Suscripción", icon: "fa-check-circle" },
    ].map(({ value, label, icon }) => (
      <div
        key={label}
        className="bg-white p-4 rounded shadow flex justify-between items-center">
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-gray-500">{label}</div>
        </div>
        <i className={`fas ${icon} text-2xl text-green-500`}></i>
      </div>
    ))}
  </div>
);
