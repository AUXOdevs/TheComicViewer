"use client";

interface ProfileFormProps {
  isLoading: boolean;
}
export const ProfileForm = ({ isLoading }: ProfileFormProps) => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="font-bold mb-2">Profile</h2>
    <form className="space-y-2">
      <input className="border p-2 rounded w-full" placeholder="Name" disabled={isLoading} />
      <input className="border p-2 rounded w-full" placeholder="Email" disabled={isLoading} />
      <button className="bg-blue-500 text-white p-2 rounded" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  </div>
);
