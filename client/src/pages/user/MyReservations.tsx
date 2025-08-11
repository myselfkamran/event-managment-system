import React, { useState, useEffect } from "react";
import { Reservation, ReservationFilters, TableColumn } from "../../types";
import { reservationService } from "../../services/reservationService";
import { useToast } from "../../context/ToastContext";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  useEffect(() => {
    loadReservations();
  }, [filters]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getMyReservations(filters);
      setReservations(response.reservations);
      setPagination(response.pagination);
    } catch (error: any) {
      showError("Failed to load reservations");
      console.error("Load reservations error:", error);
    } finally {
      setLoading(false);
    }
  };

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
        return (
          <div>
            <div className="text-sm text-gray-900">
              {eventDate.toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              {eventDate.toLocaleTimeString()}
            </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your event reservations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 rounded-md p-3">
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
                <div className="bg-green-500 rounded-md p-3">
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
                <div className="bg-red-500 rounded-md p-3">
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
            All
          </button>
          <button
            onClick={() => handleStatusFilter("confirmed")}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.status === "confirmed"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => handleStatusFilter("canceled")}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.status === "canceled"
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Canceled
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white shadow rounded-lg">
        <Table
          data={reservations}
          columns={columns}
          loading={loading}
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
                <strong>Location:</strong>{" "}
                {selectedReservation.event?.location || "Online"}
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

export default MyReservations;
