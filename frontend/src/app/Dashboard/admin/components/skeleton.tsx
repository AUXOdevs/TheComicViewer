export default function SkeletonDashboard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/3 bg-gray-300 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-300 rounded"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-300 rounded"></div>
      <div className="h-64 bg-gray-300 rounded"></div>
    </div>
  );
}
