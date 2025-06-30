// src/components/ui/Skeleton.tsx
export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`} />
);
