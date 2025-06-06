import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const res = await fetch("http://localhost:3000/api/me", {
    cache: "no-store",
    credentials: "include", 
    headers: {
      // Necesario si estás en producción con dominios distintos
      // cookie: headers().get('cookie') || '',
    },
  });

  if (!res.ok) {
    redirect("/api/auth/login");
  }

  const user = await res.json();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Hola, {user.name}</h1>
      <a href="/api/auth/logout" className="text-red-500 underline">
        Cerrar sesión
      </a>
    </main>
  );
}
