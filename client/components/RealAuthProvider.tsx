import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = "/api/auth";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "USER";
  emailVerified: boolean;
  primaryEmail: string;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
  }>;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
  }>;
  signOut: () => void;
  verifyEmail: (token: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  requestPasswordReset: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  resetPassword: (token: string, newPassword: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{
    success: boolean;
    message: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface RealAuthProviderProps {
  children: ReactNode;
}

// Helper function to handle API responses with better error handling
const handleResponse = async (response: Response) => {
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Failed to parse response JSON:", error);
    return {
      success: false,
      error: "Invalid response format from server",
    };
  }

  if (!response.ok) {
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    // Handle different HTTP error codes
    if (response.status === 401) {
      return {
        success: false,
        error: data.error || "Authentication required",
      };
    } else if (response.status === 403) {
      return {
        success: false,
        error: data.error || "Access forbidden",
      };
    } else if (response.status === 404) {
      return {
        success: false,
        error: data.error || "Resource not found",
      };
    } else if (response.status >= 500) {
      return {
        success: false,
        error: data.error || "Server error. Please try again later.",
      };
    } else {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }
  }

  return {
    success: true,
    data,
  };
};

export function RealAuthProvider({ children }: RealAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on component mount
  const checkExistingAuth = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Add timeout for validation request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${API_BASE}/validate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response more defensively
      if (!response) {
        throw new Error("No response received");
      }

      const result = await handleResponse(response);

      if (result.success && result.data?.success && result.data?.data?.user) {
        setUser({
          ...result.data.data.user,
          role: result.data.data.user.role
            ? result.data.data.user.role.toUpperCase()
            : result.data.data.user.role,
          primaryEmail: result.data.data.user.email,
        });
      } else {
        console.warn("Token validation failed:", result.error);
        try {
          localStorage.removeItem("auth_token");
        } catch (e) {
          console.warn("Could not remove auth token from localStorage");
        }
        setUser(null);
      }
    } catch (error) {
      console.warn("Auth validation error:", error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn("Auth validation timed out - continuing without authentication");
        } else if (error.message.includes('Failed to fetch')) {
          console.warn("Network error during auth validation - server may be down");
        } else {
          console.warn("Unexpected error during auth validation:", error.message);
        }
      }

      // Clear any invalid tokens and reset user state
      try {
        localStorage.removeItem("auth_token");
      } catch (e) {
        console.warn("Could not remove auth token from localStorage");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const result = await handleResponse(response);

      if (result.success && result.data.success) {
        localStorage.setItem("auth_token", result.data.data.token);
        setUser({
          ...result.data.data.user,
          role: result.data.data.user.role
            ? result.data.data.user.role.toUpperCase()
            : result.data.data.user.role,
          primaryEmail: result.data.data.user.email,
        });

        return {
          success: true,
          message: result.data.data.message,
          requiresVerification: !result.data.data.user.emailVerified,
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to create account",
        };
      }
    } catch (error) {
      console.error("SignUp error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Log detailed debugging information
      const requestUrl = `${API_BASE}/signin`;
      console.log("🔐 SignIn attempt:", { email, requestUrl, baseUrl: window.location.origin });

      // Add timeout for signin request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      console.log("🌐 Making request to:", requestUrl);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      console.log("📨 Response received:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        redirected: response.redirected
      });

      clearTimeout(timeoutId);
      const result = await handleResponse(response);

      if (result.success && result.data.success) {
        localStorage.setItem("auth_token", result.data.data.token);
        setUser({
          ...result.data.data.user,
          role: result.data.data.user.role
            ? result.data.data.user.role.toUpperCase()
            : result.data.data.user.role,
          primaryEmail: result.data.data.user.email,
        });

        return {
          success: true,
          message: result.data.data.message,
        };
      } else {
        const errorMessage = result.error || "Failed to sign in";
        return {
          success: false,
          message: errorMessage,
          requiresVerification: errorMessage.includes("verify"),
        };
      }
    } catch (error) {
      console.error("SignIn error:", error);

      let errorMessage = "Network error. Please try again.";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Unable to connect to server. Please check your connection.";
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result = await handleResponse(response);

      if (result.success && result.data.success) {
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
        return {
          success: true,
          message: result.data.data.message,
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to verify email",
        };
      }
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE}/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await handleResponse(response);

      return {
        success: result.success && result.data.success,
        message:
          result.success && result.data.success
            ? result.data.data.message
            : result.error || "Failed to send reset email",
      };
    } catch (error) {
      console.error("Password reset request error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await handleResponse(response);

      return {
        success: result.success && result.data.success,
        message:
          result.success && result.data.success
            ? result.data.data.message
            : result.error || "Failed to reset password",
      };
    } catch (error) {
      console.error("Password reset error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return {
          success: false,
          message: "Not authenticated",
        };
      }

      const response = await fetch(`${API_BASE}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await handleResponse(response);

      return {
        success: result.success && result.data.success,
        message:
          result.success && result.data.success
            ? result.data.data.message
            : result.error || "Failed to change password",
      };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    changePassword,
  };

  useEffect(() => {
    checkExistingAuth();
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Compatibility hook for existing components
export function useUser() {
  const { user } = useAuth();
  return user;
}
