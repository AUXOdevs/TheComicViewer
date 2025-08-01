
"use client";

import { Auth0Provider } from "@auth0/auth0-react";

const Auth0ProviderWithConfig = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri:
          typeof window !== "undefined" ? window.location.origin : "",
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
      }}
      cacheLocation="localstorage">
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithConfig;
