import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Event,
  Reservation,
  CreateEventRequest,
  UpdateEventRequest,
} from "../../types";
import { eventService } from "../../services/eventService";
import { reservationService } from "../../services/reservationService";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import { TableColumn } from "../../types";

// Validation schema for update event form
const eventSchema = Yup.object().shape({
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

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  useEffect(() => {
    if (id) {
      loadEventDetails();
      loadEventReservations();
    }
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getEventById(parseInt(id!));
      setEvent(eventData);
    } catch (error: any) {
      showError("Failed to load event details");
      console.error("Load event error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventReservations = async () => {
    try {
      setReservationsLoading(true);
      const response = await reservationService.getEventReservations(
        parseInt(id!)
      );
      setReservations(response.reservations);
    } catch (error: any) {
      showError("Failed to load event reservations");
      console.error("Load reservations error:", error);
    } finally {
      setReservationsLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatReservationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-50";
      case "canceled":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleUpdateEvent = async (values: UpdateEventRequest) => {
    try {
      if (!event) return;

      showLoading("Updating event...");
      await eventService.updateEvent(event.id, values);
      success("Event updated successfully");
      setIsEditModalOpen(false);

      // Reload event details
      await loadEventDetails();
    } catch (error: any) {
      showError("Failed to update event");
      console.error("Update event error:", error);
    }
  };

  const handleUpdateSubmit = (
    values: CreateEventRequest | UpdateEventRequest
  ) => {
    handleUpdateEvent(values as UpdateEventRequest);
  };

  const EventForm = React.memo(
    ({
      onSubmit,
      isEdit = false,
      initialValues,
    }: {
      onSubmit: (values: CreateEventRequest | UpdateEventRequest) => void;
      isEdit?: boolean;
      initialValues: CreateEventRequest | UpdateEventRequest;
    }) => {
      return (
        <Formik
          initialValues={initialValues}
          validationSchema={eventSchema}
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
                    placeholder="https://meet.google.com/..."
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
                    min="1"
                    max="10000"
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

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Event"}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      );
    }
  );

  const reservationColumns: TableColumn<Reservation>[] = [
    {
      key: "id",
      label: "ID",
      render: (value) => `#${value}`,
    },
    {
      key: "user",
      label: "User",
      render: (value, reservation) => {
        const user = reservation.user;
        if (!user) {
          return <div className="text-gray-500">User not found</div>;
        }
        return (
          <div>
            <div className="font-medium">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            value
          )}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Reserved On",
      render: (value) => formatReservationDate(value),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Event Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The event you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate("/admin/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/admin/events")}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Events
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-600 mt-2">
              Event ID: #{event.id} • Created by{" "}
              {event.creator?.firstName || "Unknown"}{" "}
              {event.creator?.lastName || ""}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              Edit Event
            </Button>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Event Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Event Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <p className="text-gray-900">
                  {formatEventDate(event.eventDate)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <p className="text-gray-900">
                  {event.location || "Online Event"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <p className="text-gray-900">
                  {event.availableSpots} of {event.maxCapacity} spots available
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Link
                </label>
                <p className="text-gray-900">
                  {event.onlineLink ? (
                    <a
                      href={event.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Join Meeting
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              </div>
            </div>
            {event.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-gray-900 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Event Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Event Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Reservations</span>
                <span className="font-semibold text-gray-900">
                  {reservations.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confirmed</span>
                <span className="font-semibold text-green-600">
                  {reservations.filter((r) => r.status === "confirmed").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-semibold text-red-600">
                  {reservations.filter((r) => r.status === "canceled").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available Spots</span>
                <span className="font-semibold text-blue-600">
                  {event.availableSpots}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fill Rate</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(
                    ((event.maxCapacity - event.availableSpots) /
                      event.maxCapacity) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Event Reservations ({reservations.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            All reservations for this event
          </p>
        </div>
        <div className="p-6">
          {reservationsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations found for this event.
            </div>
          ) : (
            <Table
              data={reservations}
              columns={reservationColumns}
              loading={false}
            />
          )}
        </div>
      </div>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Event"
      >
        <EventForm
          onSubmit={handleUpdateSubmit}
          isEdit
          initialValues={
            event
              ? {
                  name: event.name,
                  description: event.description || "",
                  eventDate: new Date(event.eventDate)
                    .toISOString()
                    .slice(0, 16),
                  location: event.location || "",
                  onlineLink: event.onlineLink || "",
                  maxCapacity: event.maxCapacity,
                }
              : {
                  name: "",
                  description: "",
                  eventDate: "",
                  location: "",
                  onlineLink: "",
                  maxCapacity: 50,
                }
          }
        />
      </Modal>
    </div>
  );
};

export default EventDetails;
