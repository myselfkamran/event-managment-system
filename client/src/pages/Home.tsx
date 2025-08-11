import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePopularEvents } from "../hooks/useEvents";
import { reservationService } from "../services/reservationService";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Event } from "../types";

export function Home() {
  const { user } = useAuth();
  const {
    data: popularEventsData,
    loading,
    error,
    execute: refreshPopularEvents,
  } = usePopularEvents();
  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  // State for confirmation modal and user reservations
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [userReservations, setUserReservations] = useState<Set<number>>(
    new Set()
  );

  // State for view details modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load user reservations when popular events load
  useEffect(() => {
    if (
      user &&
      popularEventsData?.events &&
      popularEventsData.events.length > 0
    ) {
      loadUserReservations();
    }
  }, [user, popularEventsData]);

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
      // Reload user reservations and popular events to update the UI
      loadUserReservations();
      // Refresh popular events to show updated available spots
      if (popularEventsData) {
        // Force refresh of popular events
        refreshPopularEvents();
      }
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

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Events
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connect with your community and never miss an exciting opportunity
            </p>
            <div className="space-x-4">
              <Link to="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary-600 hover:bg-gray-50"
                >
                  Browse Events
                </Button>
              </Link>
              {!user && (
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-primary-500 hover:bg-primary-400"
                  >
                    Get Started
                  </Button>
                </Link>
              )}
              {user && (
                <Link to="/my-reservations">
                  <Button
                    size="lg"
                    className="bg-primary-500 hover:bg-primary-400"
                  >
                    My Reservations
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose EventHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make it easy to discover, join, and manage events in your
              community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Discover Events
              </h3>
              <p className="text-gray-600">
                Find events that match your interests and location preferences
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Easy Registration
              </h3>
              <p className="text-gray-600">
                Reserve your spot with just one click and get instant
                confirmation
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Bookings
              </h3>
              <p className="text-gray-600">
                Keep track of your reservations and manage your event schedule
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Events Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Events
            </h2>
            <p className="text-xl text-gray-600">
              Don't miss out on these trending events
            </p>
          </div>

          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-600">
              <p>Failed to load popular events. Please try again later.</p>
            </div>
          )}

          {popularEventsData && popularEventsData.events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularEventsData.events.map((event) => {
                const { formatted: eventDate, isUpcoming } = formatEventDate(
                  event.eventDate
                );
                const status = getEventStatus(event);

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {event.name}
                        </h3>
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 mb-2">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {eventDate}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {event.location}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {event.availableSpots} spots left
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEvent(event)}
                          >
                            View Details
                          </Button>
                          {user &&
                            isUpcoming &&
                            event.availableSpots > 0 &&
                            !userReservations.has(event.id) && (
                              <Button
                                size="sm"
                                onClick={() => handleReserveClick(event)}
                                disabled={isReserving}
                              >
                                Reserve Spot
                              </Button>
                            )}
                          {user && userReservations.has(event.id) && (
                            <Button size="sm" variant="purple" disabled>
                              ✓ Booked
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {popularEventsData && popularEventsData.events.length === 0 && (
            <div className="text-center text-gray-600">
              <p>No popular events available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/events">
              <Button variant="outline" size="lg">
                View All Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReserveSpot}
              disabled={isReserving}
              loading={isReserving}
            >
              {isReserving ? "Reserving..." : "Confirm Reservation"}
            </Button>
          </div>
        </div>
      </Modal>

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
    </div>
  );
}
