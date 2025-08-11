import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User, UserFilters, UpdateUserRequest, TableColumn } from "../../types";
import { userService } from "../../services/userService";
import { useToast } from "../../context/ToastContext";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import Pagination from "../../components/ui/Pagination";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    page: 1,
    limit: 10,
  });

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: "",
    firstName: "",
    lastName: "",
    role: "user",
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
    [filters.search, filters.page, filters.limit]
  );

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers(memoizedFilters);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error: any) {
      showError("Failed to load users");
      console.error("Load users error:", error);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const loadingToast = showLoading("Updating user...");

    try {
      await userService.updateUser(selectedUser.id, formData);
      dismiss(loadingToast);
      success("User updated successfully");
      setIsEditModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const loadingToast = showLoading("Deleting user...");

    try {
      await userService.deleteUser(selectedUser.id);
      dismiss(loadingToast);
      success("User deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to delete user");
    }
  };

  const columns: TableColumn<User>[] = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "firstName",
      label: "First Name",
      render: (value) => value || "-",
    },
    {
      key: "lastName",
      label: "Last Name",
      render: (value) => value || "-",
    },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === "admin"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage system users and their permissions.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by email, first name, or last name..."
              value={filters.search || ""}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg">
        <Table
          data={users}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <form onSubmit={handleUpdateUser}>
          <FormField
            label="Email"
            name="email"
            type="email"
            disabled={true}
            value={formData.email}
            onChange={handleFormChange}
            required
          />

          <FormField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleFormChange}
          />

          <FormField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleFormChange}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update User
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>

          {selectedUser && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Name:</strong> {selectedUser.firstName}{" "}
                {selectedUser.lastName}
              </p>
              <p>
                <strong>Role:</strong> {selectedUser.role}
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
              onClick={handleDeleteUser}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
