"use client";
interface TitlesTableProps {
  isLoading: boolean;
}

export const TitlesTable = ({ isLoading }: TitlesTableProps) => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="font-bold mb-2">User Management</h2>
    <div className="overflow-auto">
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">John Doe</td>
              <td>john@example.com</td>
              <td>
                <button className="text-blue-500">Edit</button>
                <button className="text-red-500 ml-2">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  </div>
);
