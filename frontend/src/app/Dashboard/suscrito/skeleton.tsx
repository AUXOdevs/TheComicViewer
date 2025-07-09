"use client";
export const SkeletonDashboard = () => (
  <div className="p-4 space-y-4 animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-24 bg-gray-300 rounded"></div>
      <div className="h-24 bg-gray-300 rounded"></div>
      <div className="h-24 bg-gray-300 rounded"></div>
    </div>
    <div className="h-64 bg-gray-300 rounded"></div>
  </div>
);
