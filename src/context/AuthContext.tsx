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
  login: (email: string, password: string) => Promise<any>;
  googleLogin: (idToken: string) => Promise<any>;
  verifyTotp: (email: string, totpCode: string, totpSessionToken: string) => Promise<any>;
  loginWithRecoveryCode: (email: string, password: string, recoveryCode: string) => Promise<any>;
  requestEmailRecoveryCode: (email: string) => Promise<void>;
  loginWithEmailVerificationCode: (email: string, code: string) => Promise<any>;
  verifySignupEmailOtp: (email: string, code: string) => Promise<any>;
  logout: () => Promise<void>;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  checkAuth: () => Promise<void>;
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
        console.warn("Auth check endpoint returned the non-ok status:", response.status, data);
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
          await checkAuth();
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
        return data;
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw new Error(error.message || "Login failed");
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("refreshtoken", data.refreshtoken);
          await checkAuth();
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
        return data;
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        throw new Error(data.message || "Google Login failed");
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw new Error(error.message || "Google Login failed");
    }
  };

  const verifyTotp = async (email: string, totpCode: string, totpSessionToken: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/verify-totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, totpCode, totpSessionToken }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.recoveryCodes && data.recoveryCodes.length > 0) {
          setAuthState(prev => ({ ...prev, loading: false }));
          return data;
        }
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("refreshtoken", data.refreshtoken);
        }
        await checkAuth();
        return data;
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        throw new Error(data.message || "Verification failed");
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw new Error(error.message || "Verification failed");
    }
  };

  const loginWithRecoveryCode = async (email: string, password: string, recoveryCode: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/recovery-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, recoveryCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthState(prev => ({ ...prev, loading: false }));
        throw new Error(data.message || "Recovery-code login failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshtoken", data.refreshtoken);
      await checkAuth();
      return data;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw new Error(error.message || "Recovery-code login failed");
    }
  };

  const requestEmailRecoveryCode = async (email: string) => {
    const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/request-email-recovery", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error("Could not request an email recovery code.");
  };

  const loginWithEmailVerificationCode = async (email: string, code: string) => {
    const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/email-verification-login", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Email verification failed");
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshtoken", data.refreshtoken);
    await checkAuth();
    return data;
  };

  const verifySignupEmailOtp = async (email: string, code: string) => {
    const response = await fetch(ApiConfig.Api_Base_Url + "api/Auth/verify-signup-email-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Email OTP verification failed");
    return data;
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
    <AuthContext.Provider value={{ authState, login, googleLogin, verifyTotp, loginWithRecoveryCode, requestEmailRecoveryCode, loginWithEmailVerificationCode, verifySignupEmailOtp, logout, setAuthState, checkAuth }}>
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
