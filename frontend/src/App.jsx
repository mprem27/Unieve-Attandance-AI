import React, { useEffect, useRef, useState } from "react";
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
// 1. GLOBAL BACKGROUND ANIMATION COMPONENT
// =====================================================
function BackgroundAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let elements = [];
    
    // Balanced density
    const maxElements = 35; 

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    class AcademicElement {
      constructor() {
        this.reset();
        // Start randomly on the screen so it's visible immediately
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50; 
        this.size = Math.random() * 25 + 15; 
        
        // UPGRADED SPEED: Auto-moving floating upwards visibly
        this.speedY = -(Math.random() * 0.6 + 0.2); 
        this.speedX = (Math.random() - 0.5) * 0.3; 
        
        // UPGRADED OPACITY: Faint but clearly visible (5% to 15%)
        this.opacity = Math.random() * 0.10 + 0.05; 
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.008;
        
        // Type: 0 = ID Card, 1 = Number, 2 = Grad Cap
        this.type = Math.floor(Math.random() * 3);
        this.textValue = Math.random() > 0.5 ? Math.floor(Math.random() * 9000 + 1000).toString() : "0110";
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotSpeed;

        if (this.y < -60 || this.x < -60 || this.x > canvas.width + 60) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Emerald/Dark Green palette to match theme
        ctx.strokeStyle = `rgba(24, 94, 58, ${this.opacity})`; 
        ctx.fillStyle = `rgba(16, 185, 129, ${this.opacity})`; 
        ctx.lineWidth = 1.5;

        switch(this.type) {
          case 0: // ID CARD DESIGN
            let w = this.size * 1.4;
            let h = this.size * 0.9;
            ctx.strokeRect(-w/2, -h/2, w, h);
            ctx.strokeRect(-w/2 + 6, -h/2 + 6, w*0.3, h*0.5);
            ctx.beginPath();
            ctx.moveTo(-w/2 + w*0.45, -h/2 + 10); ctx.lineTo(w/2 - 6, -h/2 + 10);
            ctx.moveTo(-w/2 + w*0.45, -h/2 + 18); ctx.lineTo(w/2 - 12, -h/2 + 18);
            ctx.stroke();
            break;

          case 1: // STUDENT NUMBERS
            ctx.font = `600 ${this.size * 0.7}px system-ui`;
            ctx.fillText(this.textValue, -this.size/2, 0);
            break;

          case 2: // GRADUATION CAP SYMBOL
            let s = this.size;
            ctx.beginPath();
            ctx.moveTo(0, -s/3);
            ctx.lineTo(s/2, 0);
            ctx.lineTo(0, s/3);
            ctx.lineTo(-s/2, 0);
            ctx.closePath();
            ctx.moveTo(-s/4, s/8);
            ctx.quadraticCurveTo(0, s/3, s/4, s/8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s/2, 0);
            ctx.lineTo(s/2 + 4, s/4);
            ctx.stroke();
            break;
          default:
            break;
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < maxElements; i++) {
      elements.push(new AcademicElement());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < elements.length; i++) {
        elements[i].update();
        elements[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      // The canvas acts as the actual background color for the whole site
      style={{ zIndex: -1, backgroundColor: "#f8f9fb" }}
    />
  );
}

// =====================================================
// 2. DASHBOARD LAYOUT
// =====================================================
function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on mobile when navigating to a new route
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    // Background is completely transparent here so the global canvas shows through
    <div className="min-h-screen font-sans text-slate-800 antialiased bg-transparent selection:bg-emerald-100 selection:text-emerald-900">
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-72">
        
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className="min-w-0 flex-1 animate-[fadeIn_0.4s_ease-out_forwards]">
          {children}
        </main>

      </div>
    </div>
  );
}

// =====================================================
// 3. MAIN APP
// =====================================================
export default function App() {
  return (
    <>
      {/* GLOBAL STYLES FIXES */}
      <style dangerouslySetInnerHTML={{__html: `
        /* This FORCES the main HTML containers to be transparent so the canvas works */
        body, html, #root {
          background-color: transparent !important;
          min-height: 100vh;
        }

        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
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
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* GLOBAL ACADEMIC ANIMATION BACKGROUND */}
      <BackgroundAnimation />

      {/* Content wrapper ensures routing sits on top of the fixed background */}
      <div className="relative z-10 bg-transparent min-h-screen">
        <Routes>
          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* STUDENT PAGES */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><DashboardLayout><Attendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/attendance/subject/:subjectId" element={<ProtectedRoute><DashboardLayout><SubjectDetails /></DashboardLayout></ProtectedRoute>} />
          <Route path="/timetable" element={<ProtectedRoute><DashboardLayout><Timetable /></DashboardLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><DashboardLayout><ChangePassword /></DashboardLayout></ProtectedRoute>} />

          {/* ADMIN PAGES */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><Users /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users/:userId" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><UserDetails /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users/:userId/edit" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><EditUser /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/sync-status" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><SyncStatus /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/sms-logs" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><SMSLogs /></DashboardLayout></ProtectedRoute>} />

          {/* FALLBACK ROUTES */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
}