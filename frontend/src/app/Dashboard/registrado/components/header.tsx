"use client";
export const Header = () => (
  <header className="flex justify-between items-center p-4 bg-white shadow">
    <div className="flex items-center space-x-2">
      <i className="fas fa-search text-gray-500"></i>
      <input
        type="text"
        placeholder="Search..."
        className="border p-1 rounded focus:outline-none"
      />
    </div>
    <div className="flex items-center space-x-4">
      <div className="relative">
        <i className="fas fa-bell text-gray-500"></i>
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          2
        </span>
      </div>
      <div className="flex items-center space-x-2 cursor-pointer">
        <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
          SU
        </div>
        <span>Suscrito User</span>
        <i className="fas fa-chevron-down"></i>
      </div>
    </div>
  </header>
);
