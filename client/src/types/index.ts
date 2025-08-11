// User types
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Event types
export interface Event {
  id: number;
  name: string;
  description?: string;
  eventDate: string;
  location?: string;
  onlineLink?: string;
  maxCapacity: number;
  availableSpots: number;
  spotStatus?: "available" | "limited" | "fully-booked" | "past-event";
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: "user" | "admin";
  };
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

// Reservation types
export interface Reservation {
  id: number;
  userId: number;
  eventId: number;
  status: "confirmed" | "canceled";
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
}

// API response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Admin specific types
export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalReservations: number;
  activeEvents: number;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EventListResponse {
  events: Event[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReservationListResponse {
  reservations: Reservation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Update User Request
export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "user" | "admin";
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Component prop types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

// Event filters
export interface EventFilters {
  date?: string;
  name?: string;
  location?: string;
  page?: number;
  limit?: number;
}

// User filters
export interface UserFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// Reservation filters
export interface ReservationFilters {
  status?: "confirmed" | "canceled";
  eventId?: number;
  userId?: number;
  page?: number;
  limit?: number;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onRowClick?: (item: T) => void;
}
