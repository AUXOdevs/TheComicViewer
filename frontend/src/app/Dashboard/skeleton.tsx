export function SkeletonDashboard() {
  return (
    <div className="flex h-screen bg-[#8db5ac] animate-pulse">
      <div className="w-64 bg-gray-300" />
      <main className="flex-1 p-6 space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/3" />
        <div className="h-48 bg-gray-300 rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-300 rounded" />
          <div className="h-24 bg-gray-300 rounded" />
          <div className="h-24 bg-gray-300 rounded" />
        </div>
      </main>
    </div>
  );
}
