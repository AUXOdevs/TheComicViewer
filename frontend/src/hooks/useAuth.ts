"use client";

import { useEffect, useState } from "react";
import { createAuth0Client, Auth0Client, User } from "@auth0/auth0-spa-js";

let auth0Client: Auth0Client | null = null;

const config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
  authorizationParams: {
    redirect_uri: process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI!,
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!,
  },
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserWithSupabase = async (token: string, userInfo: User) => {
    const auth0_id = userInfo.sub ?? "";
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auth0_id,
          email: userInfo.email,
          nombre: userInfo.name,
          rol_id: 1, // Registrado
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("Usuario ya existe o error al crear:", errorText);
      } else {
        console.log("Usuario sincronizado correctamente con Supabase");
      }
    } catch (error) {
      console.error("Error al sincronizar con Supabase:", error);
    }
  };

  useEffect(() => {
    const initAuth0 = async () => {
      try {
        if (!auth0Client) {
          auth0Client = await createAuth0Client(config);
        }

        if (
          window.location.search.includes("code=") &&
          window.location.search.includes("state=")
        ) {
          await auth0Client.handleRedirectCallback();
          window.history.replaceState({}, document.title, "/");
        }

        const isAuth = await auth0Client.isAuthenticated();
        setIsAuthenticated(isAuth);

        if (isAuth) {
          const userInfo = await auth0Client.getUser();
          const token = await auth0Client.getTokenSilently();

          if (userInfo) {
            setUser(userInfo);
            sessionStorage.setItem("user", JSON.stringify(userInfo));
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("auth0_id", userInfo.sub ?? "");
            sessionStorage.setItem("rol", "registrado");

            await syncUserWithSupabase(token, userInfo);
          }
        } else {
          const storedUser = sessionStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("Error inicializando Auth0:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth0();
  }, []);

  const login = () => {
    if (!auth0Client) {
      const url = `https://${config.domain}/authorize?client_id=${config.clientId}&redirect_uri=${config.authorizationParams.redirect_uri}&response_type=code&scope=openid profile email&audience=${config.authorizationParams.audience}`;
      window.location.href = url;
    } else {
      auth0Client.loginWithRedirect();
    }
  };

  const logout = () => {
    sessionStorage.clear();
    if (auth0Client) {
      auth0Client.logout({
        logoutParams: { returnTo: window.location.origin },
      });
    } else {
      const logoutUrl = `https://${config.domain}/v2/logout?client_id=${config.clientId}&returnTo=${window.location.origin}`;
      window.location.href = logoutUrl;
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    token:
      typeof window !== "undefined" ? sessionStorage.getItem("token") : null,
    role:
      typeof window !== "undefined" ? sessionStorage.getItem("rol") : null,
    auth0_id:
      typeof window !== "undefined"
        ? sessionStorage.getItem("auth0_id")
        : null,
  };
}
