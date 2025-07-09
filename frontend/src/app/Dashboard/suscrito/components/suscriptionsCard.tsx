import { Profile } from "@/lib/type";
export function SubscriptionCard({ profile }: { profile: Profile }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-2">Suscripción</h2>
      {profile.subscription ? (
        <p>Activa hasta: {profile.subscription.expiresAt}</p>
      ) : (
        <p>No tienes una suscripción activa.</p>
      )}
    </div>
  );
}
