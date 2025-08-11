import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType, RegisterRequest } from "../types";
import { authService } from "../services/authService";

// Auth state type
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "INIT_COMPLETE" }
  | { type: "UPDATE_USER"; payload: User };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: true, // Start with loading true to prevent premature redirects
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        user: action.payload.user,
        token: action.payload.token,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
        token: null,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        error: null,
        loading: false,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "INIT_COMPLETE":
      return {
        ...state,
        loading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getAuthToken();
      const user = authService.getCurrentUser();

      if (token && user) {
        try {
          // Validate token with backend
          const response = await authService.getProfile();
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user: response.user, token },
          });
        } catch (error) {
          // Token is invalid, clear storage and set as not authenticated
          authService.logout();
          dispatch({ type: "INIT_COMPLETE" });
        }
      } else {
        // Set loading to false if no auth data found
        dispatch({ type: "INIT_COMPLETE" });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.login({ email, password });
      dispatch({
        type: "AUTH_SUCCESS",
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Login failed";
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterRequest): Promise<void> => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.register(userData);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Registration failed";
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    authService.logout();
    dispatch({ type: "AUTH_LOGOUT" });
  };

  // Update user function
  const updateUser = (user: User): void => {
    dispatch({ type: "UPDATE_USER", payload: user });
  };

  // Context value
  const contextValue: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    register,
    logout,
    updateUser,
    loading: state.loading,
    error: state.error,
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
