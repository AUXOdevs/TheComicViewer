"use client";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

type Role = "registrado" | "suscrito" | "admin" | null;

interface BackendUser {
  id: string;
  name: string;
  email: string;
  auth0_id: string;
  role: {
    id: string;
    name: Role;
  };
}

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();
  const [role, setRole] = useState<Role>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserFromBackend = async () => {
      if (!user || !isAuthenticated || !user.sub) return;

      const storedUser = sessionStorage.getItem("userInfo");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setRole(parsed.role);
        setAccessToken(parsed.token);
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        setAccessToken(token);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${user.sub}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Error al obtener usuario del backend");
          return;
        }

        const userData: BackendUser = await res.json();

        const roleName = userData.role?.name ?? null;
        setRole(roleName);

        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({ role: roleName, token })
        );
      } catch (err) {
        console.error("Error en fetchUserFromBackend:", err);
      }
    };

    fetchUserFromBackend();
  }, [user, isAuthenticated, getAccessTokenSilently]);

  return {
    user,
    isAuthenticated,
    login: loginWithRedirect,
    logout: () =>
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      }),
    role,
    accessToken,
  };
};
