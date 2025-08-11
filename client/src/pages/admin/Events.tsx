import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Event,
  EventFilters,
  CreateEventRequest,
  UpdateEventRequest,
  TableColumn,
} from "../../types";
import { eventService } from "../../services/eventService";
import { useToast } from "../../context/ToastContext";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import Pagination from "../../components/ui/Pagination";

// Validation schema for create/update event form
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

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<EventFilters>({
    name: undefined,
    location: undefined,
    page: 1,
    limit: 10,
  });

  // Local input state for debounced search
  const [inputFilters, setInputFilters] = useState<EventFilters>({
    name: "",
    location: "",
    page: 1,
    limit: 10,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Form state
  const [formData, setFormData] = useState<
    CreateEventRequest | UpdateEventRequest
  >({
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

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [filters.name, filters.location, filters.page, filters.limit]
  );

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents(memoizedFilters);
      setEvents(response.events);
      setPagination(response.pagination);
    } catch (error: any) {
      showError("Failed to load events");
      console.error("Load events error:", error);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, showError]);

  // Combined effect for initial load and filter changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Debounced effect for search filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        name: inputFilters.name || undefined,
        location: inputFilters.location || undefined,
        page: 1,
      }));
    }, 500); // 500ms delay for search

    return () => clearTimeout(timeoutId);
  }, [inputFilters.name, inputFilters.location]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleRowClick = (event: Event) => {
    navigate(`/admin/events/${event.id}`);
  };

  const handleCreateEvent = async (values: CreateEventRequest) => {
    const loadingToast = showLoading("Creating event...");

    try {
      await eventService.createEvent(values);
      dismiss(loadingToast);
      success("Event created successfully");
      setIsCreateModalOpen(false);
      loadEvents();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to create event");
    }
  };

  const handleUpdateEvent = async (values: UpdateEventRequest) => {
    if (!selectedEvent) return;

    const loadingToast = showLoading("Updating event...");

    try {
      await eventService.updateEvent(selectedEvent.id, values);
      dismiss(loadingToast);
      success("Event updated successfully");
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to update event");
    }
  };

  // Wrapper functions for EventForm compatibility
  const handleCreateSubmit = (
    values: CreateEventRequest | UpdateEventRequest
  ) => {
    handleCreateEvent(values as CreateEventRequest);
  };

  const handleUpdateSubmit = (
    values: CreateEventRequest | UpdateEventRequest
  ) => {
    handleUpdateEvent(values as UpdateEventRequest);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    const loadingToast = showLoading("Deleting event...");

    try {
      await eventService.deleteEvent(selectedEvent.id);
      dismiss(loadingToast);
      success("Event deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to delete event");
    }
  };

  const columns: TableColumn<Event>[] = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "name",
      label: "Event Name",
      render: (value, event) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {event.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {event.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "eventDate",
      label: "Date & Time",
      render: (value) => (
        <div>
          <div className="text-sm text-gray-900">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (value) => value || "-",
    },
    {
      key: "maxCapacity",
      label: "Capacity",
      render: (value, event) => (
        <div>
          <span className="font-medium">{event.availableSpots}</span>
          <span className="text-gray-500">/{value}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

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
                    placeholder="Enter online meeting link"
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
                    setIsEditModalOpen(false);
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
                  {isSubmitting
                    ? isEdit
                      ? "Updating..."
                      : "Creating..."
                    : isEdit
                    ? "Update Event"
                    : "Create Event"}
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
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage system events.
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

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by event name..."
            value={inputFilters.name || ""}
            onChange={(e) =>
              setInputFilters((prev) => ({ ...prev, name: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Search by location..."
            value={inputFilters.location || ""}
            onChange={(e) =>
              setInputFilters((prev) => ({ ...prev, location: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white shadow rounded-lg">
        <Table
          data={events}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRowClick={handleRowClick}
        />

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        title="Create New Event"
      >
        <EventForm
          onSubmit={handleCreateSubmit}
          initialValues={{
            name: "",
            description: "",
            eventDate: "",
            location: "",
            onlineLink: "",
            maxCapacity: 50,
          }}
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
        }}
        title="Edit Event"
      >
        <EventForm
          onSubmit={handleUpdateSubmit}
          isEdit
          initialValues={
            selectedEvent
              ? {
                  name: selectedEvent.name,
                  description: selectedEvent.description || "",
                  eventDate: new Date(selectedEvent.eventDate)
                    .toISOString()
                    .slice(0, 16),
                  location: selectedEvent.location || "",
                  onlineLink: selectedEvent.onlineLink || "",
                  maxCapacity: selectedEvent.maxCapacity,
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Event"
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete this event? This action cannot be
            undone and will also cancel all associated reservations.
          </p>

          {selectedEvent && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p>
                <strong>Event:</strong> {selectedEvent.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedEvent.eventDate).toLocaleString()}
              </p>
              <p>
                <strong>Location:</strong> {selectedEvent.location || "Online"}
              </p>
              <p>
                <strong>Capacity:</strong> {selectedEvent.availableSpots}/
                {selectedEvent.maxCapacity}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Event
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Events;
