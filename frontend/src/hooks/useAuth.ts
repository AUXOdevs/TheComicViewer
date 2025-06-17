import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useCallback } from "react";

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
    isLoading,
    error,
  } = useAuth0();
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      console.log("🔑 Token obtenido del Auth0:", token); // <-- LOG importante

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "❗ Error al obtener el usuario desde el backend:",
          response.statusText
        );
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      console.log("📦 Respuesta del backend /auth/me:", data); // <-- LOG importante
      setUserRole(data.role);
    } catch (error) {
      console.error("❗ Error en fetchUserRole:", error);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserRole();
    }
  }, [isAuthenticated, fetchUserRole]);

  return {
    isAuthenticated,
    user,
    userRole,
    loginWithRedirect,
    logout,
    isLoading,
    error,
  };
};
