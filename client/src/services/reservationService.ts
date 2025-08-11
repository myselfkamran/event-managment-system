import { apiService } from "./api";
import {
  Reservation,
  ReservationListResponse,
  ReservationFilters,
} from "../types";

class ReservationService {
  // User endpoints
  async createReservation(
    eventId: number
  ): Promise<{ message: string; reservation: Reservation }> {
    return apiService.post<{ message: string; reservation: Reservation }>(
      `/reservations/events/${eventId}/reserve`
    );
  }

  async cancelReservation(reservationId: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(
      `/reservations/${reservationId}`
    );
  }

  async getMyReservations(
    filters: ReservationFilters = {}
  ): Promise<ReservationListResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/reservations/my-reservations${
      queryString ? `?${queryString}` : ""
    }`;

    return apiService.get<ReservationListResponse>(url);
  }

  // Admin endpoints
  async getEventReservations(
    eventId: number,
    filters: ReservationFilters = {}
  ): Promise<ReservationListResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/reservations/events/${eventId}/reservations${
      queryString ? `?${queryString}` : ""
    }`;

    return apiService.get<ReservationListResponse>(url);
  }

  async getAllReservations(
    filters: ReservationFilters = {}
  ): Promise<ReservationListResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append("status", filters.status);
    if (filters.eventId) params.append("eventId", filters.eventId.toString());
    if (filters.userId) params.append("userId", filters.userId.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/reservations${queryString ? `?${queryString}` : ""}`;

    return apiService.get<ReservationListResponse>(url);
  }

  async checkUserReservation(eventId: number): Promise<{
    hasReservation: boolean;
    reservation: Reservation | null;
  }> {
    return apiService.get<{
      hasReservation: boolean;
      reservation: Reservation | null;
    }>(`/reservations/events/${eventId}/check`);
  }
}

export const reservationService = new ReservationService();
