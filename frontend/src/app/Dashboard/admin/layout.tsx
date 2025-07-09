import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#8db5ac] overflow-hidden">
      <main className="flex-1 overflow-auto p-6 max-w-full">{children}</main>
    </div>
  );
}
