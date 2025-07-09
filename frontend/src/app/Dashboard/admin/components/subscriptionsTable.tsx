
"use client";

interface SubscriptionsTableProps {
  isLoading: boolean;
}
export const SubscriptionsTable = ({ isLoading }: SubscriptionsTableProps) => (
  <div className="bg-[#20444c] text-[#8db5ac] rounded shadow p-4">
    <h2 className="font-bold mb-2">User Management</h2>
    <div className="overflow-auto">
      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
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
