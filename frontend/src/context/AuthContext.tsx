import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/authService";
import api from "../services/apiClient"; // Import the central api instance

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  client_id?: number | null;
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

// Define the refresh interval time (e.g., 14 minutes in milliseconds)
const REFRESH_INTERVAL = 14 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Custom setAccessToken function to sync state and api client headers
  const setAccessToken = (token: string | null) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
    setAccessTokenState(token);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    setAuthUser(null);
    setAccessToken(null);
    navigate("/signin");
  };

  // Effect for the initial "silent refresh" on app load
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await AuthService.refresh();
        const newAccessToken = res.data.data.accessToken;
        setAccessToken(newAccessToken);

        const userRes = await AuthService.getMe();
        setAuthUser(userRes.data.data);
      } catch (error) {
        setAuthUser(null);
        setAccessToken(null);
        // Redirect to /signin if not already there
        if (window.location.pathname !== "/signin") {
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    silentRefresh();
  }, []); // Runs only ONCE on initial mount

  // ## NEW: Effect for the proactive background refresh ##
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if there's an existing access token
      if (accessToken) {
        console.log("Proactively refreshing token in the background...");
        AuthService.refresh()
          .then((res) => {
            const newAccessToken = res.data.data.accessToken;
            setAccessToken(newAccessToken);
          })
          .catch((err) => {
            console.error("Proactive refresh failed:", err);
            // Only logout if it's a 401 or 500 error (server issues)
            // Don't logout for network errors or temporary issues
            if (err.response?.status === 401 || err.response?.status === 500) {
              console.log("Server error during refresh, logging out...");
              logout();
            } else {
              console.log("Non-critical refresh error, continuing...");
            }
          });
      }
    }, REFRESH_INTERVAL);

    // Cleanup function to clear the interval when the app unmounts
    return () => clearInterval(interval);
  }, [accessToken]); // Reruns if the token state changes

  const value = {
    authUser,
    setAuthUser,
    accessToken,
    setAccessToken,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
