// src/hooks/useAuth.ts
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useCallback } from "react";
import { toggleBlockUser, deleteUser } from "@/services/userServices";

type UserRole = "admin" | "superadmin" | "registrado" | "suscrito" | null;

export type Profile = {
  name: string;
  lastName: string;
  email: string;
  role?: { name: string };
};

export type User = {
  auth0_id: string;
  email: string;
  is_blocked: boolean;
  role?: { name: string };
};

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
    error: auth0Error,
  } = useAuth0();

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setProfileError(null);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
      setUserRole((data?.role?.name?.toLowerCase() as UserRole) ?? null);
    } catch (err) {
      setProfileError(err as Error);
      setProfile(null);
    }
  }, [getAccessTokenSilently]);

  const fetchAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("todos los usuarios:", data);

      // Ahora guardamos solo el array data.users
      if (Array.isArray(data.users)) {
        setAllUsers(data.users);
      } else {
        console.error("❗ La respuesta no trae 'users' como array:", data);
        setAllUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [getAccessTokenSilently]);

  const blockOrUnblockUser = useCallback(
    async (auth0_id: string, block: boolean) => {
      const token = await getAccessTokenSilently();
      await toggleBlockUser(token, auth0_id, block);
      fetchAllUsers();
    },
    [getAccessTokenSilently, fetchAllUsers]
  );

  const removeUser = useCallback(
    async (auth0_id: string) => {
      const token = await getAccessTokenSilently();
      await deleteUser(token, auth0_id);
      fetchAllUsers();
    },
    [getAccessTokenSilently, fetchAllUsers]
  );

  useEffect(() => {
    if (isAuthenticated && !profile) fetchUserProfile();
    if (isAuthenticated && userRole === "admin") fetchAllUsers();
  }, [isAuthenticated, profile, userRole, fetchUserProfile, fetchAllUsers]);

  return {
    isAuthenticated,
    user,
    userRole,
    profile,
    allUsers,
    loadingUsers,
    loginWithRedirect,
    logout,
    error: auth0Error || profileError,
    blockOrUnblockUser,
    removeUser,
  };
};
