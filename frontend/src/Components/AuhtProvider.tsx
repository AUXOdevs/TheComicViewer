// src/components/AuthProvider.tsx
"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: Props): React.ReactElement => {
  const router = useRouter();

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""}
      authorizationParams={{
        redirect_uri:
          typeof window !== "undefined" ? window.location.origin : "", audience: process.env.NEXT_PUBLIC_SUPABASE_URL
      }}
      onRedirectCallback={appState => {
        router.push(appState?.returnTo || "/");
      }}>
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider;
