export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4">Mi Dashboard</header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
