import { apiService } from "./api";
import type { LoginRequest } from "../types";
import type { RegisterRequest } from "../types";
import type { AuthResponse } from "../types";
import type { User } from "../types";

export class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Store token and user data
    if (response.token) {
      apiService.setAuthToken(response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    }

    return response;
  }

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/register",
      userData
    );

    // Store token and user data
    if (response.token) {
      apiService.setAuthToken(response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    }

    return response;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post("/auth/logout");
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error("Logout error:", error);
    } finally {
      // Clear local storage
      apiService.removeAuthToken();
      localStorage.removeItem("user");
    }
  }

  // Get user profile
  async getProfile(): Promise<{ user: User }> {
    return await apiService.get<{ user: User }>("/auth/profile");
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = apiService.getAuthToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "admin";
  }

  // Get auth token from apiService
  getAuthToken(): string | null {
    return apiService.getAuthToken();
  }
}

export const authService = new AuthService();
export default authService;
