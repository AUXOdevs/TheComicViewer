"use client";
export const StatsCard = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[
      { value: "1,248", label: "Total Users", icon: "fa-users" },
      { value: "342", label: "Active Sessions", icon: "fa-signal" },
      { value: "98%", label: "System Health", icon: "fa-heartbeat" },
      { value: "5", label: "Recent Alerts", icon: "fa-exclamation-triangle" },
    ].map(({ value, label, icon }) => (
      <div
        key={label}
        className="bg-white p-4 rounded shadow flex justify-between items-center">
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-gray-500">{label}</div>
        </div>
        <i className={`fas ${icon} text-2xl text-blue-500`}></i>
      </div>
    ))}
  </div>
);
