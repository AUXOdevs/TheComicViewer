"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto bg-gray-50">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
