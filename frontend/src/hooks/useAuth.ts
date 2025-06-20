import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useCallback } from "react";

type UserRole = "admin" | "superadmin" | "registrado" | "suscrito" | null;

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
    isLoading: auth0Loading,
    error: auth0Error,
  } = useAuth0();

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loadingUserRole, setLoadingUserRole] = useState<boolean>(false);
  const [roleError, setRoleError] = useState<Error | null>(null);

  const fetchUserRole = useCallback(async () => {
    setLoadingUserRole(true);
    setRoleError(null);

    try {
      const token = await getAccessTokenSilently();
      console.log("🔑 Token obtenido del Auth0:", token);

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
          response.status,
          response.statusText
        );
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 Respuesta completa del backend /auth/me:", data);

      // Extraer el nombre del rol de forma segura
      const roleName = data?.role?.name?.trim().toLowerCase();

      if (roleName) {
        console.log("✅ Rol encontrado:", roleName);
        setUserRole(roleName as UserRole);
      } else {
        console.warn("⚠️ No se encontró el nombre del rol en la respuesta.");
        setUserRole(null);
      }
    } catch (error) {
      console.error("❗ Error en fetchUserRole:", error);
      setRoleError(error as Error);
      setUserRole(null);
    } finally {
      setLoadingUserRole(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && !userRole && !loadingUserRole) {
      fetchUserRole();
    }
  }, [isAuthenticated, fetchUserRole, userRole, loadingUserRole]);

  return {
    isAuthenticated,
    user,
    userRole, // Ejemplo: "admin", "superadmin", "registrado", "suscrito", etc.
    loginWithRedirect,
    logout,
    isLoading: auth0Loading || loadingUserRole,
    error: auth0Error || roleError,
    refetchUserRole: fetchUserRole,
  };
};
