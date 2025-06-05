import { useAuth0 } from "@auth0/auth0-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const initSupabase = async () => {
      if (!isAuthenticated) return;

      try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not defined");
        }

        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: SUPABASE_URL,
          },
        });

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        setSupabaseClient(supabase);
      } catch (error) {
        console.error("Error obteniendo token de Auth0 para Supabase:", error);
      }
    };

    initSupabase();
  }, [getAccessTokenSilently, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    loading: isLoading,
    login: loginWithRedirect,
    logout: () => logout(),
    getAccessToken: getAccessTokenSilently,
    supabase: supabaseClient,
  };
};
