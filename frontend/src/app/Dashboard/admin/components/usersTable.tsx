
"use client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function UsersTable() {
  const { allUsers, loadingUsers, blockOrUnblockUser, removeUser } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = allUsers.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar por email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="p-2 border rounded mb-4 w-full"
      />
      {loadingUsers ? (
        <div>Loading users...</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Rol</th>
              <th className="py-2 px-4 border">Bloqueado</th>
              <th className="py-2 px-4 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(u => (
              <tr key={u.auth0_id}>
                <td className="py-2 px-4 border">{u.email}</td>
                <td className="py-2 px-4 border">{u.role?.name ?? "-"}</td>
                <td className="py-2 px-4 border">
                  {u.is_blocked ? "Sí" : "No"}
                </td>
                <td className="py-2 px-4 border flex space-x-2">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                    onClick={() =>
                      confirm("¿Seguro?") &&
                      blockOrUnblockUser(u.auth0_id, !u.is_blocked)
                    }>
                    {u.is_blocked ? "Desbloquear" : "Bloquear"}
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    onClick={() =>
                      confirm("¿Eliminar usuario?") && removeUser(u.auth0_id)
                    }>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2 py-1 bg-gray-200 rounded">
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-2 py-1 bg-gray-200 rounded">
          Siguiente
        </button>
      </div>
    </div>
  );
}

