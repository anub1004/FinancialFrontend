import { createContext, useState, useContext, useEffect } from "react";
import { ApiConfig } from "../config/apiconfig";
import toast from "react-hot-toast";
interface AuthState {
  user: string | null;
  role: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    userId: null,
    isAuthenticated: false,
    loading: false,
  });
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      console.log("Checking authentication status...");
      const token = localStorage.getItem("token");

      const response = await fetch(
        ApiConfig.Api_Base_Url + "api/Auth/checkauth",
        {
          credentials: "include",
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        }
      );
      const data = await response.json();
      if(!response.ok) {
        console.warn("Auth check endpoint returned the non -ok status:", response.status,data);
      }
      if (data.isAuthenticated) {
        console.log("User authenticated, setting state:", { user: data.user, role: data.role, userId: data.userId });
        setAuthState({
          user: data.user,
          role: data.role,
          userId: data.userId,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        console.log("User not authenticated from response");
        setAuthState({
          user: null,
          role: null,
          userId: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthState({
        user: null,
        role: null,
        userId: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  };
  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("refreshtoken", data.refreshtoken);
        }
        await checkAuth();
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw new Error(error.message || "Login failed");
    }
  };
  const logout = async () => {
    try {
      console.log("Performing logout...");
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshtoken");
      localStorage.removeItem("theme");
      const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/logout",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          }, body: JSON.stringify({
          token: refreshToken 
 })
        });

      console.log("Logout response status:", response.status);
      const responseData = await response.json();
      toast.success(responseData.message || "Logged out successfully");
      console.log("Logout response data:", responseData);
      localStorage.removeItem("token");
      setAuthState({
        user: null,
        role: null,
        userId: null,
        isAuthenticated: false,
        loading: false,
      });
      if (!response.ok) {
        console.warn("Backend logout endpoint returned non-ok status:", response.status, responseData);
      }
      console.log("Logout completed successfully");
    } catch (error: any) {
      console.error("Logout error:", error);   
      localStorage.removeItem("token");
      setAuthState({
        user: null,
        role: null,
        userId: null,
        isAuthenticated: false,
        loading: false,
      });
      throw new Error(error.message || "Logout failed");
    }
  };
  return (
    <AuthContext.Provider value={{ authState, login, logout, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
