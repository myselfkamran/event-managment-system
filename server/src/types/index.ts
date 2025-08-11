import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "user" | "admin";
  };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  eventDate: string;
  location?: string;
  onlineLink?: string;
  maxCapacity: number;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  eventDate?: string;
  location?: string;
  onlineLink?: string;
  maxCapacity?: number;
}

export interface EventFilters {
  date?: string;
  name?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export enum ReservationStatus {
  CONFIRMED = "confirmed",
  CANCELED = "canceled",
}

export interface JWTPayload {
  id: number;
  email: string;
  role: "user" | "admin";
}
