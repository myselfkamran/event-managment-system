import { apiService } from "./api";
import {
  User,
  UserListResponse,
  UpdateUserRequest,
  UpdateProfileRequest,
  UserFilters,
} from "../types";

class UserService {
  // Admin endpoints
  async getAllUsers(filters: UserFilters = {}): Promise<UserListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/users${queryString ? `?${queryString}` : ""}`;

    return apiService.get<UserListResponse>(url);
  }

  async getUserById(id: number): Promise<{ user: User }> {
    return apiService.get<{ user: User }>(`/users/${id}`);
  }

  async updateUser(
    id: number,
    userData: UpdateUserRequest
  ): Promise<{ message: string; user: User }> {
    return apiService.put<{ message: string; user: User }>(
      `/users/${id}`,
      userData
    );
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/users/${id}`);
  }

  // User profile endpoints
  async updateProfile(
    userData: UpdateProfileRequest
  ): Promise<{ message: string; user: User }> {
    return apiService.put<{ message: string; user: User }>(
      "/users/profile/me",
      userData
    );
  }

  async getProfile(): Promise<{ user: User }> {
    return apiService.get<{ user: User }>("/auth/profile");
  }
}

export const userService = new UserService();
