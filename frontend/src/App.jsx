import React, { useEffect, useState } from "react";
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
import ForgotPassword from "./pages/ForgotPassword";
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
// GLOBAL BACKGROUND ICONS
// =====================================================

const ICONS = [
  // 1. Graduation cap
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 14L58 26L32 38L6 26L32 14Z" fill="currentColor"/><path d="M17 30V43C17 43 22 50 32 50C42 50 47 43 47 43V30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M54 27V41" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="54" cy="44" r="3.5" fill="currentColor"/></svg>`,

  // 2. ID card
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="13" width="48" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="22" cy="27" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 43C12 37 16.5 34 22 34C27.5 34 32 37 32 43" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="24" x2="49" y2="24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="31" x2="49" y2="31" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="38" x2="45" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,

  // 3. Open book
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 20C27 15 16 15 9 17V46C16 44 27 44 32 49C37 44 48 44 55 46V17C48 15 37 15 32 20Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><line x1="32" y1="20" x2="32" y2="49" stroke="currentColor" stroke-width="3"/></svg>`,

  // 4. Laptop
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="13" y="14" width="38" height="25" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M25 21L20 26.5L25 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M39 21L44 26.5L39 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 47L13 39H51L58 47C58 48.5 56.5 49 55 49H9C7.5 49 6 48.5 6 47Z" fill="currentColor"/></svg>`,

  // 5. Pencil
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(45 32 32)"><rect x="27" y="8" width="10" height="32" fill="currentColor"/><rect x="27" y="4" width="10" height="6" fill="currentColor" opacity="0.6"/><path d="M27 40L32 52L37 40Z" fill="currentColor"/></g></svg>`,

  // 6. Diploma
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="16" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="17" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="17" cy="46" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="47" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="47" cy="46" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><line x1="24" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="24" y1="31" x2="40" y2="31" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="24" y1="37" x2="34" y2="37" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,

  // 7. Light bulb
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 8C22 8 15 15 15 24C15 30 18 34 21 37C23 39 24 41 24 44H40C40 41 41 39 43 37C46 34 49 30 49 24C49 15 42 8 32 8Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><line x1="25" y1="50" x2="39" y2="50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="27" y1="56" x2="37" y2="56" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,

  // 8. Circuit chip
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="24" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="none" stroke="currentColor" stroke-width="3"/><line x1="26" y1="20" x2="26" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="20" x2="32" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="20" x2="38" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="26" y1="44" x2="26" y2="53" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="44" x2="32" y2="53" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="44" x2="38" y2="53" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="26" x2="11" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="32" x2="11" y2="32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="38" x2="11" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="26" x2="53" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="32" x2="53" y2="32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="38" x2="53" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,

  // 9. Atom
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26" ry="8" transform="rotate(45 32 32)" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="32" cy="32" rx="26" ry="8" transform="rotate(-45 32 32)" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="currentColor"/></svg>`,

  // 10. Gear
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 8v8m0 32v8m24-24h-8M16 32H8m20.5-17l-5.6-5.6m22.6 22.6l-5.6-5.6M49 49l-5.6-5.6M21.5 49l-5.6-5.6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,

  // 11. Code
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M26 16l-12 16 12 16M38 16l12 16-12 16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  // 12. Database
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="18" rx="20" ry="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 18v28c0 4.4 9 8 20 8s20-3.6 20-8V18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 32c0 4.4 9 8 20 8s20-3.6 20-8" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
];

const COLORS = [
  "#0f172a",
  "#1e3a8a",
  "#7f1d1d",
  "#064e3b",
  "#4c1d95",
  "#000000",
];

const BG_ANIMS = [
  "driftA",
  "driftB",
  "driftC",
  "driftD",
];

const FG_ANIMS = [
  "fgFloat1",
  "fgFloat2",
  "fgFloat3",
];

// =====================================================
// BACKGROUND ANIMATION
// =====================================================
//
// IMPORTANT PERFORMANCE CHANGE:
//
// Login and Forgot Password pages do NOT render the
// expensive animated SVG background.
//
// Dashboard/admin pages continue using the existing
// animation.
//
// =====================================================

function BackgroundAnimation() {
  const location = useLocation();

  const isPublicPage =
    location.pathname === "/login" ||
    location.pathname === "/forgot-password";

  const [bgElements, setBgElements] = useState([]);
  const [fgElements, setFgElements] = useState([]);

  useEffect(() => {
    if (isPublicPage) {
      setBgElements([]);
      setFgElements([]);
      return;
    }

    const isMobile =
      window.innerWidth < 640;

    // Reduced slightly for better performance.
    // Existing visual effect is preserved.
    const bgCount = isMobile ? 20 : 35;
    const fgCount = isMobile ? 3 : 5;

    const generateElements = (
      count,
      isForeground
    ) => {
      const arr = [];

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const icon =
          ICONS[
            Math.floor(
              Math.random() *
                ICONS.length
            )
          ];

        const color =
          COLORS[
            Math.floor(
              Math.random() *
                COLORS.length
            )
          ];

        const left =
          Math.random() * 100 + "%";

        if (isForeground) {
          const size =
            60 +
            Math.random() * 40;

          const opacity =
            0.04 +
            Math.random() * 0.04;

          const dur =
            60 +
            Math.random() * 60;

          const delay =
            -(Math.random() * dur);

          const anim =
            FG_ANIMS[
              Math.floor(
                Math.random() *
                  FG_ANIMS.length
              )
            ];

          arr.push({
            id: i,
            icon,
            color,
            size,
            left,
            top: "0",
            opacity,
            anim,
            dur,
            delay,
          });
        } else {
          const size =
            25 +
            Math.random() * 25;

          const opacity =
            0.3 +
            Math.random() * 0.4;

          const top =
            Math.random() * 100 + "%";

          const dur =
            25 +
            Math.random() * 20;

          const delay =
            -Math.random() * dur;

          const anim =
            BG_ANIMS[
              Math.floor(
                Math.random() *
                  BG_ANIMS.length
              )
            ];

          arr.push({
            id: i,
            icon,
            color,
            size,
            left,
            top,
            opacity,
            anim,
            dur,
            delay,
          });
        }
      }

      return arr;
    };

    setBgElements(
      generateElements(
        bgCount,
        false
      )
    );

    setFgElements(
      generateElements(
        fgCount,
        true
      )
    );

    return () => {
      setBgElements([]);
      setFgElements([]);
    };
  }, [isPublicPage]);

  // -----------------------------------------------------
  // Do not render animation on authentication pages.
  // -----------------------------------------------------

  if (isPublicPage) {
    return null;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .floating-bg {
              position: fixed;
              inset: 0;
              overflow: hidden;
              pointer-events: none;
            }

            .float-icon {
              position: absolute;
              will-change: transform, opacity;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }

            .float-icon svg {
              display: block;
              width: 100%;
              height: 100%;
              overflow: visible;
            }

            @keyframes driftA {
              0%, 100% {
                transform:
                  translate(0, 0)
                  rotate(0deg)
                  scale(1);
              }

              50% {
                transform:
                  translate(30px, -60px)
                  rotate(15deg)
                  scale(1.05);
              }
            }

            @keyframes driftB {
              0%, 100% {
                transform:
                  translate(0, 0)
                  rotate(0deg)
                  scale(1);
              }

              50% {
                transform:
                  translate(-35px, -50px)
                  rotate(-12deg)
                  scale(0.95);
              }
            }

            @keyframes driftC {
              0%, 100% {
                transform:
                  translate(0, 0)
                  rotate(0deg)
                  scale(1);
              }

              33% {
                transform:
                  translate(25px, -30px)
                  rotate(8deg)
                  scale(1.04);
              }

              66% {
                transform:
                  translate(-20px, -60px)
                  rotate(-8deg)
                  scale(0.96);
              }
            }

            @keyframes driftD {
              0%, 100% {
                transform:
                  translate(0, 0)
                  rotate(0deg)
                  scale(1);
              }

              50% {
                transform:
                  translate(0px, -80px)
                  rotate(20deg)
                  scale(1.1);
              }
            }

            @keyframes fgFloat1 {
              0% {
                transform:
                  translateY(110vh)
                  rotate(0deg);
                opacity: 0;
              }

              2% {
                opacity: var(--max-opacity);
              }

              8% {
                opacity: var(--max-opacity);
              }

              10% {
                transform:
                  translateY(-110vh)
                  rotate(45deg);
                opacity: 0;
              }

              100% {
                transform:
                  translateY(-110vh)
                  rotate(45deg);
                opacity: 0;
              }
            }

            @keyframes fgFloat2 {
              0% {
                transform:
                  translate(-20vw, 110vh)
                  rotate(0deg);
                opacity: 0;
              }

              2% {
                opacity: var(--max-opacity);
              }

              8% {
                opacity: var(--max-opacity);
              }

              10% {
                transform:
                  translate(20vw, -110vh)
                  rotate(-30deg);
                opacity: 0;
              }

              100% {
                transform:
                  translate(20vw, -110vh)
                  rotate(-30deg);
                opacity: 0;
              }
            }

            @keyframes fgFloat3 {
              0% {
                transform:
                  translate(20vw, 110vh)
                  rotate(0deg);
                opacity: 0;
              }

              2% {
                opacity: var(--max-opacity);
              }

              8% {
                opacity: var(--max-opacity);
              }

              10% {
                transform:
                  translate(-20vw, -110vh)
                  rotate(60deg);
                opacity: 0;
              }

              100% {
                transform:
                  translate(-20vw, -110vh)
                  rotate(60deg);
                opacity: 0;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .float-icon {
                animation: none !important;
              }
            }
          `,
        }}
      />

      {/* =================================================
          BACKGROUND LAYER
      ================================================= */}

      <div
        className="floating-bg"
        style={{
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {bgElements.map(
          (el) => (
            <div
              key={`bg-${el.id}`}
              className="float-icon"
              style={{
                width: `${el.size}px`,
                height: `${el.size}px`,
                left: el.left,
                top: el.top,
                color: el.color,
                opacity:
                  el.opacity.toFixed(
                    2
                  ),
                animation:
                  `${el.anim} ${el.dur}s ${el.delay}s infinite ease-in-out`,
              }}
              dangerouslySetInnerHTML={{
                __html: el.icon,
              }}
            />
          )
        )}
      </div>

      {/* =================================================
          FOREGROUND LAYER
          Reduced z-index so it never sits above UI.
      ================================================= */}

      <div
        className="floating-bg"
        style={{
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {fgElements.map(
          (el) => (
            <div
              key={`fg-${el.id}`}
              className="float-icon"
              style={{
                width: `${el.size}px`,
                height: `${el.size}px`,
                left: el.left,
                top: el.top,
                color: el.color,
                "--max-opacity":
                  el.opacity.toFixed(
                    3
                  ),
                opacity: 0,
                animation:
                  `${el.anim} ${el.dur}s ${el.delay}s infinite linear`,
              }}
              dangerouslySetInnerHTML={{
                __html: el.icon,
              }}
            />
          )
        )}
      </div>
    </>
  );
}

// =====================================================
// DASHBOARD LAYOUT
// =====================================================

function DashboardLayout({
  children,
}) {
  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  const location =
    useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen font-sans text-slate-800 antialiased bg-transparent selection:bg-indigo-100 selection:text-indigo-900">

      <Sidebar
        isOpen={
          isSidebarOpen
        }
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-72">

        <Navbar
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
        />

        <main className="min-w-0 flex-1 relative z-10 animate-[fadeIn_0.4s_ease-out_forwards]">
          {children}
        </main>

      </div>
    </div>
  );
}

// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

            .material-symbols-outlined {
              font-family:
                'Material Symbols Outlined' !important;

              font-weight: normal;
              font-style: normal;
              font-size: 24px;
              line-height: 1;
              letter-spacing: normal;
              text-transform: none;
              display: inline-block;
              white-space: nowrap;
              word-wrap: normal;
              direction: ltr;

              -webkit-font-feature-settings:
                'liga';

              -webkit-font-smoothing:
                antialiased;
            }

            body,
            html,
            #root {
              background-color: #f8fafc !important;
              min-height: 100vh;
              margin: 0;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform:
                  translateY(10px);
              }

              to {
                opacity: 1;
                transform:
                  translateY(0);
              }
            }
          `,
        }}
      />

      {/* =================================================
          GLOBAL BACKGROUND
      ================================================= */}

      <BackgroundAnimation />

      {/* =================================================
          ROUTING
      ================================================= */}

      <div className="relative z-10">

        <Routes>

          {/* =================================================
              PUBLIC
          ================================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword />
            }
          />

          {/* =================================================
              STUDENT - DASHBOARD
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

          {/* =================================================
              STUDENT - ATTENDANCE
          ================================================= */}

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

          {/* =================================================
              STUDENT - NOTIFICATIONS
          ================================================= */}

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

          {/* =================================================
              STUDENT - PROFILE
          ================================================= */}

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

          {/* =================================================
              STUDENT - CHANGE PASSWORD
          ================================================= */}

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
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/:userId"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <DashboardLayout>
                  <UserDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/:userId/edit"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <DashboardLayout>
                  <EditUser />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sync-status"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <DashboardLayout>
                  <SyncStatus />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sms-logs"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                ]}
              >
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

      </div>
    </>
  );
}