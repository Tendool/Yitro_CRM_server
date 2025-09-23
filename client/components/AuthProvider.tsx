import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: "ADMIN" | "USER";
  primaryEmail: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const storedUser = localStorage.getItem("crm_user");
      const storedToken = localStorage.getItem("auth_token");
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Clear old yutro domain sessions
          if (userData.email && userData.email.includes("yutro.com")) {
            localStorage.removeItem("crm_user");
            localStorage.removeItem("auth_token");
            setLoading(false);
            return;
          }
          
          // Validate token with backend
          try {
            const response = await fetch("/api/auth/validate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${storedToken}`,
              },
            });
            
            if (response.ok) {
              console.log("✅ Token validated, user session restored");
              setUser(userData);
            } else {
              console.log("❌ Token invalid, clearing session");
              localStorage.removeItem("crm_user");
              localStorage.removeItem("auth_token");
            }
          } catch (error) {
            console.log("❌ Token validation failed, using stored user data anyway");
            // If validation endpoint doesn't exist, trust stored data for now
            setUser(userData);
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("crm_user");
          localStorage.removeItem("auth_token");
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const determineUserRole = (email: string): "ADMIN" | "USER" => {
    // Admin users: emails containing "admin" or specific admin emails
    return email.includes("admin") || email === "admin@yitro.com"
      ? "ADMIN"
      : "USER";
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔐 Attempting signin with backend API for:", email);
      
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend signin successful:", data);
        
        if (data.success && data.data?.user && data.data?.token) {
          const userData: User = {
            id: data.data.user.id,
            email: data.data.user.email,
            primaryEmail: data.data.user.email,
            displayName: data.data.user.displayName,
            role: data.data.user.role.toUpperCase(),
          };

          setUser(userData);
          localStorage.setItem("crm_user", JSON.stringify(userData));
          localStorage.setItem("auth_token", data.data.token);
          console.log("✅ User data saved to localStorage");
          return true;
        }
      } else {
        console.error("❌ Backend signin failed:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Error details:", errorData);
      }
      
      return false;
    } catch (error) {
      console.error("❌ Sign in error:", error);
      return false;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<boolean> => {
    try {
      console.log("📝 Attempting signup with backend API for:", email);
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend signup successful:", data);
        
        if (data.success && data.data?.user && data.data?.token) {
          const userData: User = {
            id: data.data.user.id,
            email: data.data.user.email,
            primaryEmail: data.data.user.email,
            displayName: data.data.user.displayName,
            role: data.data.user.role.toUpperCase(),
          };

          setUser(userData);
          localStorage.setItem("crm_user", JSON.stringify(userData));
          localStorage.setItem("auth_token", data.data.token);
          console.log("✅ User data saved to localStorage after signup");
          return true;
        }
      } else {
        console.error("❌ Backend signup failed:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Error details:", errorData);
      }
      
      return false;
    } catch (error) {
      console.error("❌ Sign up error:", error);
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("crm_user");
    localStorage.removeItem("auth_token");
    console.log("🚪 User signed out, tokens cleared");
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Compatibility hook for Stack Auth pattern
export function useUser() {
  const { user } = useAuth();
  return user;
}
