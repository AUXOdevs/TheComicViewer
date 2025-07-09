const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAllUsers(token: string) {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json(); // El backend devuelve usuarios con `auth0_id`
}


// Cambiar rol
export async function updateUserRole(
  token: string,
  auth0_id: string,
  newRoleId: string
) {
  const res = await fetch(`${API_URL}/users/${auth0_id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role_id: newRoleId }),
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

// Bloquear o desbloquear
export async function toggleBlockUser(
  token: string,
  auth0_id: string,
  block: boolean
) {
  const res = await fetch(`${API_URL}/users/${auth0_id}/block`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_blocked: block }),
  });
  if (!res.ok) throw new Error("Failed to block/unblock user");
  return res.json();
}

// src/services/userServices.ts
export const deleteUser = async (auth0_id: string, token: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/${auth0_id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error("Error al eliminar usuario");
};

