import { Profile } from "@/lib/type";

export function ProfileForm({ profile }: { profile: Profile }) {
  return (
    <div className="bg-[#20444c] text-[#8db5ac] rounded-xl shadow p-4">
      <h2 className="text-lg text-[#ba681c] font-semibold mb-2">Perfil</h2>
      <p>Nombre: {profile.name}</p>
      <p>Email: {profile.email}</p>
    </div>
  );
}
