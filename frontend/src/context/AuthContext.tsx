import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/authService";

// Define the shape of the auth user (customize as needed)
export interface AuthUser {
    id: number;
    email: string;
    role: string;
    client_id?: number | null;
    // Add more fields as needed
}

interface AuthContextType {
    authUser: AuthUser | null;
    setAuthUser: (user: AuthUser | null) => void;
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setAuthUser(null);
    setAccessToken(null);
    navigate("/signin");
  };

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async (token: string) => {
      try {
        const res = await AuthService.getMe(token);
        const data = res.data;
        if (data.success && data.data) {
          if (isMounted) setAuthUser(data.data);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const refreshAndFetch = async () => {
      try {
        const res = await AuthService.refresh();
        const data = res.data;
        if (data.success && data.data && data.data.accessToken) {
          setAccessToken(data.data.accessToken);
          return await fetchUser(data.data.accessToken);
        }
        return false;
      } catch {
        return false;
      }
    };

    setLoading(true);
    // Always try /refresh on mount if no accessToken
    if (!accessToken) {
      refreshAndFetch().then((refreshed) => {
        if (!refreshed && isMounted) {
          setAuthUser(null);
          setAccessToken(null);
        }
        if (isMounted) setLoading(false);
      });
    } else if (!authUser && accessToken) {
      fetchUser(accessToken).then((success) => {
        if (!success) {
          // Try to refresh token and fetch user again
          refreshAndFetch().then((refreshed) => {
            if (!refreshed && isMounted) {
              setAuthUser(null);
              setAccessToken(null);
            }
            if (isMounted) setLoading(false);
          });
        } else {
          if (isMounted) setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [accessToken, authUser]);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        setAuthUser,
        accessToken,
        setAccessToken,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Removed default export to avoid Vite HMR warning
