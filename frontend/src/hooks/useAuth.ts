import { useAuth0 } from "@auth0/auth0-react";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  return {
    user,
    isAuthenticated,
    loading: isLoading,
    login: loginWithRedirect,
    logout: () => logout(),
    getAccessToken: getAccessTokenSilently,
  };
};
