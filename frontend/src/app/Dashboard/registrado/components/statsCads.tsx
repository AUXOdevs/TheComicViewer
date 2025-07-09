import { Profile } from "@/lib/type";

export function StatsCards({ profile }: { profile: Profile }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[#20444c]   rounded-xl shadow p-4">
        <h2 className="text-lg text-[#ba681c] font-semibold">Nombre</h2>
        <p className="text-[#8db5ac]">{profile.name}</p>
      </div>
      <div className="bg-[#20444c]   rounded-xl shadow p-4">
        <h2 className="text-lg text-[#ba681c] font-semibold">Email</h2>
        <p className="text-[#8db5ac]">{profile.email}</p>
      </div>
      <div className="bg-[#20444c]   rounded-xl shadow p-4">
        <h2 className="text-lg text-[#ba681c] font-semibold">Rol</h2>
        <p className="text-[#8db5ac]">{profile.role?.name}</p>
      </div>
    </div>
  );
}
