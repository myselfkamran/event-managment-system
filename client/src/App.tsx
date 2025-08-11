import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Layout } from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import Events from "./pages/Events";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import AdminEvents from "./pages/admin/Events";
import EventDetails from "./pages/admin/EventDetails";
import Reservations from "./pages/admin/Reservations";

// User pages
import Profile from "./pages/user/Profile";
import MyReservations from "./pages/user/MyReservations";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public routes with layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />

            {/* Auth routes without layout (full screen) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected user routes with layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                          User Dashboard
                        </h1>
                        <p className="text-gray-600 mb-8">
                          Welcome to your dashboard!
                        </p>
                        <div className="space-y-4">
                          <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4">
                              Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <a
                                href="/profile"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                              >
                                👤 Profile Settings
                              </a>
                              <a
                                href="/my-reservations"
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                              >
                                📅 My Reservations
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-reservations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyReservations />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Events routes */}
            <Route
              path="/events"
              element={
                <Layout>
                  <Events />
                </Layout>
              }
            />

            {/* Admin routes with admin layout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/:id" element={<EventDetails />} />
              <Route path="reservations" element={<Reservations />} />
            </Route>

            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
