"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const SuscriptorSidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: "/Dashboard/suscrito", label: "Dashboard", icon: "fas fa-home" },
    {
      href: "/Dashboard/suscrito/historyList",
      label: "History",
      icon: "fas fa-clock",
    },
    {
      href: "/Dashboard/suscrito/favoritesList",
      label: "Favorites",
      icon: "fas fa-star",
    },
    {
      href: "/Dashboard/suscrito/suscriptionsCards",
      label: "Subscription",
      icon: "fas fa-id-card",
    },
    {
      href: "/Dashboard/suscrito/settings",
      label: "Configuración",
      icon: "fas fa-cog",
    },
  ];

  return (
    <aside className="w-64 mt-6 h-full bg-[#20444c] text-[#8db5ac] flex flex-col">
      <div className="p-4 mt-6 text-[#ba681c] font-bold text-xl">Suscriptor</div>
      <nav className="flex flex-col space-y-2 p-2">
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center p-2 rounded font-medium
                ${
                  isActive
                    ? "bg-[#8db5ac] text-[#ba681c]"
                    : "hover:bg-[#8db5ac] hover:text-[#ba681c]"
                }
              `}>
              <i className={`${icon} mr-2`}></i> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
