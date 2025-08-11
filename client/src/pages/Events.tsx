import React, { useState, useEffect } from "react";
import { Event, EventFilters } from "../types";
import { eventService } from "../services/eventService";
import { reservationService } from "../services/reservationService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userReservations, setUserReservations] = useState<Set<number>>(
    new Set()
  );

  // Local input state for debounced search
  const [inputFilters, setInputFilters] = useState({
    name: "",
    location: "",
    date: "",
  });

  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    limit: 12,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  const { user } = useAuth();
  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  // Debounced effect for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        name: inputFilters.name || undefined,
        location: inputFilters.location || undefined,
        date: inputFilters.date || undefined,
        page: 1,
      }));
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [inputFilters.name, inputFilters.location, inputFilters.date]);

  useEffect(() => {
    loadEvents();
  }, [filters]);

  // Load user reservations when events load
  useEffect(() => {
    if (user && events.length > 0) {
      loadUserReservations();
    }
  }, [user, events]);

  const loadEvents = async () => {
    try {
      setSearchLoading(true);
      const response = await eventService.getEvents(filters);
      setEvents(response.events);
      setPagination(response.pagination);
    } catch (error: any) {
      showError("Failed to load events");
      console.error("Load events error:", error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const loadUserReservations = async () => {
    try {
      const response = await reservationService.getMyReservations();
      const reservedEventIds = new Set(
        response.reservations
          .filter((r) => r.status === "confirmed")
          .map((r) => r.eventId)
      );
      setUserReservations(reservedEventIds);
    } catch (error: any) {
      console.error("Failed to load user reservations:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleNameFilter = (name: string) => {
    setInputFilters((prev) => ({ ...prev, name }));
  };

  const handleLocationFilter = (location: string) => {
    setInputFilters((prev) => ({ ...prev, location }));
  };

  const handleDateFilter = (date: string) => {
    setInputFilters((prev) => ({ ...prev, date }));
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleReserveClick = (event: Event) => {
    setSelectedEvent(event);
    setIsConfirmModalOpen(true);
  };

  const handleReserveSpot = async () => {
    if (!selectedEvent || !user) return;

    const loadingToast = showLoading("Reserving your spot...");
    setIsReserving(true);

    try {
      await reservationService.createReservation(selectedEvent.id);
      dismiss(loadingToast);
      success(`Successfully reserved spot for "${selectedEvent.name}"!`);
      setIsConfirmModalOpen(false);
      setSelectedEvent(null);
      // Reload events to update available spots and user reservations
      loadEvents();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to reserve spot");
    } finally {
      setIsReserving(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isUpcoming = date > now;

    return {
      formatted: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isUpcoming,
    };
  };

  const getEventStatus = (event: Event) => {
    const { isUpcoming } = formatEventDate(event.eventDate);

    // Check if user has already booked this event
    if (user && userReservations.has(event.id)) {
      return { text: "Booked", color: "text-purple-600" };
    }

    // Use spotStatus from backend if available, otherwise fallback to local calculation
    if (event.spotStatus) {
      switch (event.spotStatus) {
        case "past-event":
          return { text: "Past Event", color: "text-gray-500" };
        case "fully-booked":
          return { text: "Fully Booked", color: "text-red-600" };
        case "limited":
          return { text: "Limited Spots", color: "text-orange-600" };
        case "available":
          return { text: "Available", color: "text-green-600" };
        default:
          break;
      }
    }

    // Fallback to local calculation if spotStatus is not available
    if (!isUpcoming) return { text: "Past Event", color: "text-gray-500" };
    if (event.availableSpots === 0)
      return { text: "Fully Booked", color: "text-red-600" };
    if (event.availableSpots <= 5)
      return { text: "Limited Spots", color: "text-orange-600" };
    return { text: "Available", color: "text-green-600" };
  };

  console.log(selectedEvent, "selectedEvent");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
        <p className="text-gray-600">
          Discover and reserve spots for upcoming events
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by name
            </label>
            <input
              type="text"
              placeholder="Event name..."
              value={inputFilters.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleNameFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              placeholder="Location..."
              value={inputFilters.location}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleLocationFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={inputFilters.date}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Search Loading Indicator */}
      {searchLoading && (
        <div className="mb-4 flex justify-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Searching events...</span>
          </div>
        </div>
      )}

      {/* Initial Loading State */}
      {loading && events.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading events...</span>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!loading && events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {events.map((event) => {
            const { formatted: eventDate, isUpcoming } = formatEventDate(
              event.eventDate
            );
            const status = getEventStatus(event);

            return (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {event.name}
                    </h3>
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📅</span>
                      <span
                        className={
                          isUpcoming ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {eventDate}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📍</span>
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">👥</span>
                      <span>
                        {event.availableSpots} of {event.maxCapacity} spots
                        available
                      </span>
                    </div>

                    {event.creator && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">👤</span>
                        <span>
                          {event.creator.firstName || event.creator.lastName
                            ? `${event.creator.firstName || ""} ${
                                event.creator.lastName || ""
                              }`.trim()
                            : event.creator.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewEvent(event)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      View Details
                    </button>
                    {user &&
                      isUpcoming &&
                      event.availableSpots > 0 &&
                      !userReservations.has(event.id) && (
                        <button
                          onClick={() => handleReserveClick(event)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Reserve Spot
                        </button>
                      )}
                    {user && userReservations.has(event.id) && (
                      <button
                        disabled
                        className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md cursor-not-allowed"
                      >
                        ✓ Booked
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        title={selectedEvent?.name || "Event Details"}
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Event Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Event Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">
                    {formatEventDate(selectedEvent.eventDate).formatted}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {selectedEvent.location}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">
                    {selectedEvent.availableSpots} of{" "}
                    {selectedEvent.maxCapacity} spots available
                  </span>
                </div>
                {selectedEvent.onlineLink && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Online Link:</span>
                    <a
                      href={selectedEvent.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Creator Info */}
            {selectedEvent.creator && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Event Organizer
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedEvent.creator.firstName ||
                      selectedEvent.creator.lastName
                        ? `${selectedEvent.creator.firstName || ""} ${
                            selectedEvent.creator.lastName || ""
                          }`.trim()
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {selectedEvent.creator.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium capitalize">
                      {selectedEvent.creator.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
              {user &&
                formatEventDate(selectedEvent.eventDate).isUpcoming &&
                selectedEvent.availableSpots > 0 &&
                !userReservations.has(selectedEvent.id) && (
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      handleReserveClick(selectedEvent);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Reserve Spot
                  </button>
                )}
              {user && userReservations.has(selectedEvent.id) && (
                <button
                  disabled
                  className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md cursor-not-allowed"
                >
                  ✓ Already Booked
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Confirm Reservation for "${selectedEvent?.name}"`}
      >
        <div className="space-y-4 text-center">
          <p className="text-gray-700">
            Are you sure you want to reserve a spot for this event? This action
            cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleReserveSpot}
              disabled={isReserving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReserving ? "Reserving..." : "Confirm Reservation"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Events;
