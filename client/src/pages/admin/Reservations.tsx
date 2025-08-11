import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Reservation,
  ReservationFilters,
  TableColumn,
  Event,
  User,
} from "../../types";
import { reservationService } from "../../services/reservationService";
import { eventService } from "../../services/eventService";
import { userService } from "../../services/userService";
import { useToast } from "../../context/ToastContext";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ReservationFilters>({
    page: 1,
    limit: 10,
  });

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.page,
      filters.limit,
      filters.status,
      filters.eventId,
      filters.userId,
    ]
  );

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservationService.getAllReservations(
        memoizedFilters
      );
      setReservations(response.reservations);
      setPagination(response.pagination);
    } catch (error: any) {
      showError("Failed to load reservations");
      console.error("Load reservations error:", error);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, showError]);

  const loadEvents = useCallback(async () => {
    try {
      const response = await eventService.getEventsForAdmin({ limit: 100 });
      setEvents(response.events);
    } catch (error: any) {
      console.error("Load events error:", error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAllUsers({ limit: 100 });
      setUsers(response.users);
    } catch (error: any) {
      console.error("Load users error:", error);
    }
  }, []);

  useEffect(() => {
    loadReservations();
    loadEvents();
    loadUsers();
  }, [loadReservations, loadEvents, loadUsers]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleStatusFilter = (status: "confirmed" | "canceled" | "") => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  const handleEventFilter = (eventId: number | "") => {
    setFilters((prev) => ({
      ...prev,
      eventId: eventId || undefined,
      page: 1,
    }));
  };

  const handleUserFilter = (userId: number | "") => {
    setFilters((prev) => ({
      ...prev,
      userId: userId || undefined,
      page: 1,
    }));
  };

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };

  const handleCancel = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsCancelModalOpen(true);
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;

    const loadingToast = showLoading("Canceling reservation...");

    try {
      await reservationService.cancelReservation(selectedReservation.id);
      dismiss(loadingToast);
      success("Reservation canceled successfully");
      setIsCancelModalOpen(false);
      setSelectedReservation(null);
      loadReservations();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to cancel reservation");
    }
  };

  const columns: TableColumn<Reservation>[] = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "user",
      label: "User",
      render: (value, reservation) => (
        <div>
          <div className="font-medium text-gray-900">
            {reservation.user?.firstName || reservation.user?.lastName
              ? `${reservation.user.firstName || ""} ${
                  reservation.user.lastName || ""
                }`.trim()
              : "Unknown User"}
          </div>
          <div className="text-sm text-gray-500">
            {reservation.user?.email || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "event",
      label: "Event",
      render: (value, reservation) => (
        <div>
          <div className="font-medium text-gray-900">
            {reservation.event?.name || "Unknown Event"}
          </div>
          {reservation.event?.location && (
            <div className="text-sm text-gray-500">
              📍 {reservation.event.location}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "event",
      label: "Event Date",
      render: (value, reservation) => {
        if (!reservation.event?.eventDate) return "-";
        const eventDate = new Date(reservation.event.eventDate);
        const now = new Date();
        const isUpcoming = eventDate > now;

        return (
          <div>
            <div
              className={`text-sm ${
                isUpcoming ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {eventDate.toLocaleDateString()}
            </div>
            <div
              className={`text-sm ${
                isUpcoming ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {eventDate.toLocaleTimeString()}
            </div>
            {!isUpcoming && (
              <div className="text-xs text-orange-600 font-medium">
                Past Event
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === "confirmed"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Reserved On",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const confirmedReservations = reservations.filter(
    (r) => r.status === "confirmed"
  );
  const canceledReservations = reservations.filter(
    (r) => r.status === "canceled"
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Reservation Management
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all system reservations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-200 rounded-md p-3">
                  <span className="text-white text-xl">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reservations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pagination.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-200 rounded-md p-3">
                  <span className="text-white text-xl">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Confirmed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {confirmedReservations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-red-200 rounded-md p-3">
                  <span className="text-white text-xl">❌</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Canceled
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {canceledReservations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter("")}
            className={`px-3 py-1 text-sm rounded-full border ${
              !filters.status
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Reservations
          </button>
          <button
            onClick={() => handleStatusFilter("confirmed")}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.status === "confirmed"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Confirmed Only
          </button>
          <button
            onClick={() => handleStatusFilter("canceled")}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.status === "canceled"
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Canceled Only
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white shadow rounded-lg">
        <Table
          data={reservations}
          columns={columns}
          loading={loading}
          onView={handleView}
          onDelete={(reservation) =>
            reservation.status === "confirmed"
              ? handleCancel(reservation)
              : undefined
          }
        />

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* View Reservation Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Reservation Details"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Reservation ID
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedReservation.id}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Status</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedReservation.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedReservation.status}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                User Information
              </h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p>
                  <strong>Name:</strong>{" "}
                  {selectedReservation.user?.firstName ||
                  selectedReservation.user?.lastName
                    ? `${selectedReservation.user.firstName || ""} ${
                        selectedReservation.user.lastName || ""
                      }`.trim()
                    : "Not provided"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {selectedReservation.user?.email || "Not available"}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  {selectedReservation.user?.role || "Unknown"}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Event Information
              </h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p>
                  <strong>Event:</strong>{" "}
                  {selectedReservation.event?.name || "Unknown Event"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {selectedReservation.event?.eventDate
                    ? new Date(
                        selectedReservation.event.eventDate
                      ).toLocaleString()
                    : "Unknown"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {selectedReservation.event?.location || "Online"}
                </p>
                {selectedReservation.event?.onlineLink && (
                  <p>
                    <strong>Online Link:</strong>
                    <a
                      href={selectedReservation.event.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      {selectedReservation.event.onlineLink}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Reservation Timeline
              </h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p>
                  <strong>Reserved on:</strong>{" "}
                  {new Date(selectedReservation.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Last updated:</strong>{" "}
                  {new Date(selectedReservation.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Reservation"
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to cancel this reservation? This action cannot
            be undone.
          </p>

          {selectedReservation && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p>
                <strong>User:</strong> {selectedReservation.user?.email}
              </p>
              <p>
                <strong>Event:</strong> {selectedReservation.event?.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {selectedReservation.event?.eventDate
                  ? new Date(
                      selectedReservation.event.eventDate
                    ).toLocaleString()
                  : "Unknown"}
              </p>
              <p>
                <strong>Reserved on:</strong>{" "}
                {new Date(selectedReservation.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Keep Reservation
            </button>
            <button
              onClick={handleCancelReservation}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel Reservation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;
