import { useAuth0 } from "@auth0/auth0-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Role = "registrado" | "suscrito" | "admin";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(
    null
  );
  const [role, setRole] = useState<Role>("registrado");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const syncWithSupabase = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        });

        setSupabaseClient(supabase);

        const { data: existingUser, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("auth0_id", user.sub)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error consultando usuario:", error);
          return;
        }

        let finalUser = existingUser;

        if (!existingUser) {
          const { data: newUser, error: insertError } = await supabase
            .from("usuarios")
            .insert([
              {
                auth0_id: user.sub,
                nombre: user.name,
                email: user.email,
                foto: user.picture,
                rol: "registrado",
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error("Error creando usuario en Supabase:", insertError);
            return;
          }

          finalUser = newUser;
        }

        const usuario = {
          id: user.sub,
          nombre: user.name,
          email: user.email,
          foto: user.picture,
          rol: finalUser.rol as Role,
          token: accessToken,
        };

        sessionStorage.setItem("usuario", JSON.stringify(usuario));
        setRole(finalUser.rol);
      } catch (err) {
        console.error("Error en sincronización:", err);
      }
    };

    syncWithSupabase();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  return {
    user,
    isAuthenticated,
    loading: isLoading,
    login: loginWithRedirect,
    logout: () =>
      logout({ logoutParams: { returnTo: window.location.origin } }),
    supabase: supabaseClient,
    token,
    role,
  };
};
