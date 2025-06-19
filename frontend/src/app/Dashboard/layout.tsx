import { Sidebar } from "lucide-react";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
  admin,
  registrado,
  suscrito,
}: {
  children: ReactNode; // fallback
  admin: ReactNode;
  registrado: ReactNode;
  suscrito: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4">Mi Dashboard</header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4">
        <Sidebar/>
        <section className="col-span-3 p-4">
          {admin || registrado || suscrito || children}
        </section>
      </main>
    </div>
  );
}
