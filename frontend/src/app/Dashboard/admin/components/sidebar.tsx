"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const menuItems = [
  { icon: "fa-home", label: "Dashboard", href: "/Dashboard/admin" },
  { icon: "fa-users", label: "Usuarios", href: "#" },
  { icon: "fa-book", label: "Títulos", href: "#" },
  { icon: "fa-money-check-alt", label: "Suscripciones", href: "#" },
  { icon: "fa-user-cog", label: "Mi perfil", href: "#" },
];

export function Sidebar() {
  const [active, setActive] = useState("Dashboard");
  const router = useRouter();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold border-b border-gray-800">
        Admin Panel
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => {
              setActive(item.label);
              if (item.href !== "#") {
                router.push(item.href);
              }
            }}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-md ${
              active === item.label ? "bg-gray-700" : "hover:bg-gray-800"
            }`}>
            <i className={`fas ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
