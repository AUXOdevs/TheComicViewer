"use client";
export const SubscriptionCard = () => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="font-bold mb-2">Suscripción</h2>
    <p>
      Estado: <span className="text-green-500">Activa</span>
    </p>
    <button className="mt-2 bg-red-500 text-white p-2 rounded">
      Cancelar suscripción
    </button>
  </div>
);
