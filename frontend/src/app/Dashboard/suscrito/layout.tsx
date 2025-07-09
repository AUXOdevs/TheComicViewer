import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen mt-6 bg-[#8db5ac] ">
      <main className="flex-1  p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
