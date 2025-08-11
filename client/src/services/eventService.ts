import { apiService } from "./api";
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
  EventListResponse,
} from "../types";

export class EventService {
  // Get all events with filters
  async getEvents(filters?: EventFilters): Promise<EventListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/events?${queryString}` : "/events";

    return await apiService.get<EventListResponse>(url);
  }

  // Get popular events
  async getPopularEvents(): Promise<{
    events: Event[];
    message: string;
  }> {
    return await apiService.get("/events/popular");
  }

  // Get event by ID
  async getEventById(id: number): Promise<Event> {
    const response = await apiService.get<{ event: Event }>(`/events/${id}`);
    return response.event;
  }

  // Create new event (admin only)
  async createEvent(eventData: CreateEventRequest): Promise<{
    message: string;
    event: Event;
  }> {
    return await apiService.post("/events", eventData);
  }

  // Update event (admin only)
  async updateEvent(
    id: number,
    eventData: UpdateEventRequest
  ): Promise<{
    message: string;
    event: Event;
  }> {
    return await apiService.put(`/events/${id}`, eventData);
  }

  // Delete event (admin only)
  async deleteEvent(id: number): Promise<{ message: string }> {
    return await apiService.delete(`/events/${id}`);
  }

  // Get events for admin dashboard
  async getEventsForAdmin(
    filters: EventFilters = {}
  ): Promise<EventListResponse> {
    const params = new URLSearchParams();

    if (filters.name) params.append("name", filters.name);
    if (filters.location) params.append("location", filters.location);
    if (filters.date) params.append("date", filters.date);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const url = `/events${queryString ? `?${queryString}` : ""}`;

    return apiService.get<EventListResponse>(url);
  }

  async getDashboardStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
  }> {
    return apiService.get<{
      totalEvents: number;
      activeEvents: number;
    }>("/events/dashboard/stats");
  }
}

export const eventService = new EventService();
export default eventService;
