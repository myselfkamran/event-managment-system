import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { userService } from "../../services/userService";
import { UpdateProfileRequest } from "../../types";
import FormField from "../../components/ui/FormField";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const {
    success,
    error: showError,
    loading: showLoading,
    dismiss,
  } = useToast();

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    email: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const initialDataRef = useRef<UpdateProfileRequest | null>(null);

  useEffect(() => {
    if (user) {
      const initialData = {
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      };
      setFormData(initialData);
      initialDataRef.current = initialData;
    }
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check if form has changes
  useEffect(() => {
    if (initialDataRef.current) {
      const hasFormChanges =
        formData.email !== initialDataRef.current.email ||
        formData.firstName !== initialDataRef.current.firstName ||
        formData.lastName !== initialDataRef.current.lastName;
      setHasChanges(hasFormChanges);
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = showLoading("Updating profile...");
    setLoading(true);

    try {
      const response = await userService.updateProfile(formData);
      dismiss(loadingToast);
      success("Profile updated successfully");

      // Update the user data in AuthContext with the response from the API
      if (updateUser && response.user) {
        updateUser(response.user);
      }

      // Update initial data reference to reflect the new state
      initialDataRef.current = {
        email: response.user.email,
        firstName: response.user.firstName || "",
        lastName: response.user.lastName || "",
      };
      setHasChanges(false);
    } catch (error: any) {
      dismiss(loadingToast);
      showError(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your personal information and account settings.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                placeholder="Enter your email"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  placeholder="Enter your first name"
                />

                <FormField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Account Information
                </h3>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Role:</strong> {user.role}
                  </p>
                  <p>
                    <strong>Member since:</strong>{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Last updated:</strong>{" "}
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Security
          </h3>
          <div className="text-sm text-gray-600 mb-4">
            <p>
              For security reasons, password changes are not available through
              this interface.
            </p>
            <p>
              If you need to change your password, please contact the
              administrator.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Security
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Keep your account secure by using a strong password and
                    logging out when you're done.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
