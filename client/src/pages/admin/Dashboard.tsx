import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { userService } from "../../services/userService";
import { eventService } from "../../services/eventService";
import { reservationService } from "../../services/reservationService";
import { Event, CreateEventRequest } from "../../types";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalReservations: number;
  activeEvents: number;
}

interface ChartData {
  name: string;
  value: number;
}

// Validation schema for create event form
const createEventSchema = Yup.object().shape({
  name: Yup.string()
    .min(1, "Event name is required")
    .max(255, "Event name must be less than 255 characters")
    .required("Event name is required"),
  description: Yup.string().max(
    1000,
    "Description must be less than 1000 characters"
  ),
  eventDate: Yup.date()
    .min(new Date(), "Event date must be in the future")
    .required("Event date is required"),
  location: Yup.string()
    .min(1, "Location is required")
    .max(255, "Location must be less than 255 characters")
    .required("Location is required"),
  onlineLink: Yup.string()
    .min(1, "Online link is required")
    .url("Must be a valid URL")
    .max(500, "Online link must be less than 500 characters")
    .required("Online link is required"),
  maxCapacity: Yup.number()
    .min(1, "Max capacity must be at least 1")
    .max(10000, "Max capacity must be less than 10000")
    .required("Max capacity is required"),
});

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEvents: 0,
    totalReservations: 0,
    activeEvents: 0,
  });
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const isLoadingRef = useRef(false);

  // Form state for create event
  const [formData, setFormData] = useState<CreateEventRequest>({
    name: "",
    description: "",
    eventDate: "",
    location: "",
    onlineLink: "",
    maxCapacity: 50,
  });

  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        usersResponse,
        eventsResponse,
        reservationsResponse,
        dashboardStats,
        todayEventsData,
        recentEventsData,
      ] = await Promise.all([
        userService.getAllUsers({ limit: 1 }),
        eventService.getEvents({ limit: 1 }),
        reservationService.getAllReservations({ limit: 1 }),
        eventService.getDashboardStats(),
        eventService.getEvents({ limit: 10 }), // For today's events
        eventService.getEvents({ limit: 5 }), // For recent events
      ]);

      setStats({
        totalUsers: usersResponse.pagination.total,
        totalEvents: eventsResponse.pagination.total,
        totalReservations: reservationsResponse.pagination.total,
        activeEvents: dashboardStats.activeEvents,
      });

      // Filter today's events
      const today = new Date();
      const todayEvents = eventsResponse.events.filter((event) => {
        const eventDate = new Date(event.eventDate);
        return (
          eventDate.getDate() === today.getDate() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getFullYear() === today.getFullYear()
        );
      });
      setTodayEvents(todayEvents);

      // Get recent events (last 5)
      setRecentEvents(eventsResponse.events.slice(0, 5));
    } catch (error: any) {
      const errorMessage = "Failed to load dashboard data";
      setError(errorMessage);
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleCreateEvent = async (values: CreateEventRequest) => {
    const loadingToast = showLoading("Creating event...");

    try {
      // Format the data properly for the backend
      const eventData = {
        ...values,
        maxCapacity: parseInt(values.maxCapacity.toString()) || 50,
        // Ensure empty strings are not sent for optional fields
        location: values.location || undefined,
        onlineLink: values.onlineLink || undefined,
        description: values.description || undefined,
      };

      console.log("Sending event data:", eventData);
      await eventService.createEvent(eventData);
      dismiss(loadingToast);
      success("Event created successfully");
      setIsCreateModalOpen(false);
      loadDashboardData(); // Refresh dashboard data
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to create event");
    }
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  // Chart data
  const pieChartData: ChartData[] = [
    { name: "Users", value: stats.totalUsers },
    { name: "Events", value: stats.totalEvents },
    { name: "Reservations", value: stats.totalReservations },
    { name: "Active Events", value: stats.activeEvents },
  ];

  const barChartData = recentEvents.map((event) => ({
    name: event.name,
    capacity: event.maxCapacity,
    available: event.availableSpots,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-blue-500",
      link: "/admin/users",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: "🎉",
      color: "bg-green-500",
      link: "/admin/events",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Active Events",
      value: stats.activeEvents,
      icon: "📅",
      color: "bg-yellow-500",
      link: "/admin/events",
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "Total Reservations",
      value: stats.totalReservations,
      icon: "🎫",
      color: "bg-purple-500",
      link: "/admin/reservations",
      change: "+23%",
      changeType: "positive",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load dashboard data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadDashboardData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const EventForm = React.memo(
    ({ onSubmit }: { onSubmit: (values: CreateEventRequest) => void }) => {
      const initialValues: CreateEventRequest = {
        name: "",
        description: "",
        eventDate: "",
        location: "",
        onlineLink: "",
        maxCapacity: 50,
      };

      return (
        <Formik
          initialValues={initialValues}
          validationSchema={createEventSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name *
                  </label>
                  <Field
                    type="text"
                    name="name"
                    placeholder="Enter event name"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.name && touched.name
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    placeholder="Enter event description"
                    rows={4}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.description && touched.description
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <ErrorMessage
                    name="description"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date & Time *
                  </label>
                  <div className="flex space-x-2">
                    <Field
                      type="datetime-local"
                      name="eventDate"
                      className={`mt-1 block flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.eventDate && touched.eventDate
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        if (input) {
                          input.blur();
                        }
                      }}
                      className="mt-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      OK
                    </button>
                  </div>
                  <ErrorMessage
                    name="eventDate"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <Field
                    type="text"
                    name="location"
                    placeholder="Enter event location"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.location && touched.location
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <ErrorMessage
                    name="location"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Online Link *
                  </label>
                  <Field
                    type="url"
                    name="onlineLink"
                    placeholder="Enter online meeting link (optional)"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.onlineLink && touched.onlineLink
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <ErrorMessage
                    name="onlineLink"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Capacity *
                  </label>
                  <Field
                    type="number"
                    name="maxCapacity"
                    placeholder="Enter maximum capacity"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.maxCapacity && touched.maxCapacity
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  <ErrorMessage
                    name="maxCapacity"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      );
    }
  );

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome to the admin dashboard. Here's an overview of your system.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="mr-2">➕</span>
          Create Event
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.color} rounded-xl p-3 shadow-lg`}>
                    <span className="text-white text-2xl">{card.icon}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {card.value.toLocaleString()}
                    </dd>
                    <dd className="text-sm text-green-600 font-medium">
                      {card.change}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Events Capacity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="capacity" fill="#8884d8" name="Max Capacity" />
                <Bar
                  dataKey="available"
                  fill="#82ca9d"
                  name="Available Spots"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's Events */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Today's Events
        </h3>
        {todayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {event.name}
                  </h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Today
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {event.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(event.eventDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>{event.location || "Online"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {event.availableSpots} spots available
                  </span>
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📅</div>
            <p className="text-gray-500">No events scheduled for today</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <span className="mr-2">➕</span>
            Create New Event
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <span className="mr-2">👥</span>
            Manage Users
          </Link>
          <Link
            to="/admin/reservations"
            className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <span className="mr-2">📋</span>
            View Reservations
          </Link>
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        title="Create New Event"
      >
        <EventForm onSubmit={handleCreateEvent} />
      </Modal>
    </div>
  );
};

export default Dashboard;
