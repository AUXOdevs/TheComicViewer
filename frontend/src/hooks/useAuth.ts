import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useCallback } from "react";

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

  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingUserRole, setLoadingUserRole] = useState<boolean>(false);
  const [roleError, setRoleError] = useState<Error | null>(null);

  const fetchUserRole = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingUserRole(true);
    setRoleError(null);

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();

      console.log("📦 /auth/me:", data);

      if (data?.role?.name) {
        setUserRole(data.role.name.toLowerCase()); // <-- asegúrate que sea lowercase para comparar luego
      } else {
        setUserRole(null);
      }
    } catch (error) {
      setRoleError(error as Error);
      setUserRole(null);
    } finally {
      setLoadingUserRole(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && userRole === null && !loadingUserRole) {
      fetchUserRole();
    }
  }, [isAuthenticated, userRole, fetchUserRole, loadingUserRole]);

  return {
    isAuthenticated,
    user,
    userRole,
    loginWithRedirect,
    logout,
    isLoading: auth0Loading || loadingUserRole,
    error: auth0Error || roleError,
    refetchUserRole: fetchUserRole,
  };
};
