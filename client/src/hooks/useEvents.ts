import { useState, useCallback } from "react";
import {
  Event,
  EventFilters,
  CreateEventRequest,
  UpdateEventRequest,
} from "../types";
import { eventService } from "../services/eventService";
import { useApi } from "./useApi";

export function useEvents(filters?: EventFilters) {
  const apiCall = useCallback(() => eventService.getEvents(filters), [filters]);

  return useApi<{
    events: Event[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(apiCall);
}

export function usePopularEvents() {
  const apiCall = useCallback(() => eventService.getPopularEvents(), []);

  return useApi<{
    events: Event[];
    message: string;
  }>(apiCall);
}

export function useEvent(id: number) {
  const apiCall = useCallback(() => eventService.getEventById(id), [id]);

  return useApi<{ event: Event }>(apiCall);
}

export function useEventMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = useCallback(async (eventData: CreateEventRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventService.createEvent(eventData);
      setLoading(false);
      return result;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create event";
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, []);

  const updateEvent = useCallback(
    async (id: number, eventData: UpdateEventRequest) => {
      setLoading(true);
      setError(null);

      try {
        const result = await eventService.updateEvent(id, eventData);
        setLoading(false);
        return result;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to update event";
        setError(errorMessage);
        setLoading(false);
        throw error;
      }
    },
    []
  );

  const deleteEvent = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventService.deleteEvent(id);
      setLoading(false);
      return result;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to delete event";
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    loading,
    error,
  };
}
