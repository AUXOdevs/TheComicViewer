// src/lib/auth0.ts
import { createAuth0Client, Auth0Client } from "@auth0/auth0-spa-js";

let auth0Client: Auth0Client;

export const initAuth0 = async () => {
  auth0Client = await createAuth0Client({
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN as string,
    clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID as string,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE as string, 
    },
  });
  return auth0Client;
};

export const getAuth0 = () => {
  if (!auth0Client) throw new Error("Auth0 not initialized");
  return auth0Client;
};
