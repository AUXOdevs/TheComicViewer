import { Profile, Favorite } from "@/lib/type";
export function FavoritesList({ profile }: { profile: Profile }) {
  return (
    <div className="bg-[#20444c] text-[#8db5ac] rounded-xl shadow p-4">
      <h2 className="text-lg text-[#ba681c] font-semibold mb-2">Favoritos</h2>
      <ul className="space-y-1">
        {profile.favorites?.map((fav: Favorite, idx: number) => (
          <li key={idx} className="border p-2 rounded">
            {fav.title}
          </li>
        )) || <p>Sin favoritos.</p>}
      </ul>
    </div>
  );
}
