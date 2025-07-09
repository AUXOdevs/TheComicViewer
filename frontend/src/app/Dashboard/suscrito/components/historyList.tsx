import { Profile, HistoryItem } from "@/lib/type";

// Define HistoryItem type if not imported; adjust fields as needed


export function HistoryList({ profile }: { profile: Profile }) {
  // supongamos que tienes profile.history
  return (
    <div className="bg-[#20444c] text-[#8db5ac] rounded-xl shadow p-4">
      <h2 className="text-lg text-[#ba681c] font-semibold mb-2">Historial</h2>
      <ul className="space-y-1">
        {profile.history?.map((item: HistoryItem, idx: number) => (
          <li key={idx} className="border p-2 rounded">
            {item.title} - {item.date}
          </li>
        )) || <p>Sin historial.</p>}
      </ul>
    </div>
  );
}

