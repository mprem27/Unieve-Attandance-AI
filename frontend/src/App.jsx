import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// =====================================================
// AUTH
// =====================================================

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// STUDENT PAGES
// =====================================================

import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import SubjectDetails from "./pages/SubjectDetails";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Timetable from "./pages/Timetable";

// =====================================================
// ADMIN PAGES
// =====================================================

import AdminDashboard from "./admin/AdminDashboard";
import Users from "./admin/Users";
import UserDetails from "./admin/UserDetails";
import EditUser from "./admin/EditUser";
import SyncStatus from "./admin/SyncStatus";
import SMSLogs from "./admin/SMSLogs";

// =====================================================
// COMMON COMPONENTS
// =====================================================

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// =====================================================
// DASHBOARD LAYOUT
// =====================================================

function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-72">

        <Navbar
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
        />

        <main className="min-w-0 flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}

// =====================================================
// APP
// =====================================================

export default function App() {
  return (
    <Routes>

      {/* =================================================
          PUBLIC
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =================================================
          STUDENT
      ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Attendance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance/subject/:subjectId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SubjectDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* =================================================
          STUDENT - TIMETABLE
      ================================================= */}

      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Timetable />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Notifications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ChangePassword />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* =================================================
          ADMIN
      ================================================= */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* =================================================
          ADMIN - EDIT STUDENT
      ================================================= */}

      <Route
        path="/admin/users/:userId/edit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <EditUser />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/sync-status"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <SyncStatus />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/sms-logs"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <SMSLogs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      {/* =================================================
          FALLBACK
      ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}