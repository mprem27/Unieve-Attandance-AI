import React, { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
} from "react-router-dom";
import useAuth from "../hooks/useAuth";

const AMS_PORTAL_URL = "https://ams.veltech.edu.in/Login.htm";

const studentLinks = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    name: "Attendance",
    path: "/attendance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" />
        <path d="M4 19h16" />
        <path d="M8 15l3-3 2 2 4-5" />
      </svg>
    ),
  },
  {
    name: "Timetable",
    path: "/timetable",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <path d="M8 14h2" />
        <path d="M14 14h2" />
        <path d="M8 18h2" />
        <path d="M14 18h2" />
      </svg>
    ),
  },
  {
    name: "AMS Portal",
    path: AMS_PORTAL_URL,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V9l7-5 7 5v12" />
        <path d="M9 21v-6h6v6" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    ),
  },
  {
    name: "Notifications",
    path: "/notifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    name: "Profile",
    path: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 00-16 0" />
      </svg>
    ),
  },
  {
    name: "Security",
    path: "/change-password",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

const adminLinks = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    name: "Sync Status",
    path: "/admin/sync-status",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16" />
        <path d="M16 21v-5h5" />
      </svg>
    ),
  },
  {
    name: "SMS Logs",
    path: "/admin/sms-logs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14v10z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    ),
  },
];

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

export default function Sidebar({ isOpen = false, onClose }) {
  const { user } = useAuth();
  const links = user?.role === "admin" ? adminLinks : studentLinks;

  return (
    <>
      {/* =====================================================
          MOBILE SIDEBAR (Circular Menu)
      ===================================================== */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        <button
          type="button"
          onClick={onClose}
          className={`absolute z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all duration-500 ${
            isOpen ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0"
          }`}
          aria-label="Close menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative flex h-[320px] w-[320px] items-center justify-center">
          {links.map((link, index) => {
            const total = links.length;
            const angle = (360 / total) * index - 90;
            const radius = 120;

            const itemStyle = {
              transform: isOpen
                ? `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg) scale(1)`
                : `rotate(${angle}deg) translate(0px) rotate(${-angle}deg) scale(0)`,
              opacity: isOpen ? 1 : 0,
              transitionDelay: isOpen ? `${150 + index * 50}ms` : "0ms",
            };

            if (link.external) {
              return (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="absolute flex flex-col items-center justify-center transition-all duration-500"
                  style={itemStyle}
                >
                  <div className="group flex flex-col items-center gap-2">
                    {/* Vel Tech Red for External Mobile links */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#b91c1c]/30 bg-[#b91c1c]/90 text-white shadow-lg shadow-[#b91c1c]/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#b91c1c]">
                      <span className="h-6 w-6">{link.icon}</span>
                    </div>
                    <span className="whitespace-nowrap text-xs font-bold tracking-wide text-white drop-shadow-md">
                      {link.name}
                    </span>
                  </div>
                </a>
              );
            }

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                end={link.path === "/dashboard" || link.path === "/admin"}
                className="absolute flex flex-col items-center justify-center transition-all duration-500"
                style={itemStyle}
              >
                {({ isActive }) => (
                  <div className="group flex flex-col items-center gap-2">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? "bg-[#1e3a8a] text-white shadow-[0_0_25px_rgba(30,58,138,0.6)]" // Navy Blue Active
                          : "border border-white/20 bg-white/10 text-white backdrop-blur-md"
                      }`}
                    >
                      <span className="h-6 w-6">{link.icon}</span>
                    </div>
                    <span
                      className={`whitespace-nowrap text-xs tracking-wide drop-shadow-md ${
                        isActive ? "font-bold text-[#0ea5e9]" : "font-semibold text-slate-200" // Cyan text Active
                      }`}
                    >
                      {link.name}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200/50 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:flex">
        
        {/* LOGO HEADER */}
        <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-100 px-6">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5">
            <img
              src="/logo.png"
              alt="UniEve AI"
              className="h-6 w-6 object-contain"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          </div>
          <div>
            {/* Navy to Cyan Gradient */}
            <h1 className="bg-gradient-to-r from-[#1e3a8a] to-[#0ea5e9] bg-clip-text text-lg font-black tracking-tight text-transparent">
              UniEve AI
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b91c1c]">
              Attendance
            </p>
          </div>
        </div>

        {/* 🟢 STUDENT PROFILE HERO CARD (STRICTLY DEEP GREEN & EMERALD) */}
        <div className="m-5 shrink-0 rounded-2xl bg-gradient-to-r from-[#185e3a] to-[#0a311b] p-5 shadow-md relative overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border-[6px] border-white/5 pointer-events-none"></div>
          <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full border-[6px] border-white/5 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-extrabold text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-white tracking-wide">
                {user?.name || "Student"}
              </p>
              <p className="truncate text-[11px] font-medium text-emerald-100/80 mt-0.5">
                {user?.email || "No email provided"}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex items-center">
            <span className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-50 backdrop-blur-sm">
              {user?.role || "Student"}
            </span>
          </div>
        </div>

        {/* NAVIGATION LINKS (Using Logo Colors: Navy, Red, Gold, Cyan) */}
        <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4">
          <p className="mb-3 mt-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {user?.role === "admin" ? "Administration" : "Main Menu"}
          </p>

          <div className="space-y-1.5">
            {links.map((link) => {
              if (link.external) {
                return (
                  <a
                    key={link.path}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3.5 rounded-xl border border-blue-100/60 bg-gradient-to-r from-blue-50 to-blue-50/50 px-3.5 py-3 text-sm font-bold text-[#1e3a8a] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0ea5e9] hover:shadow-md hover:shadow-blue-100/50"
                  >
                    {/* Gold left indicator */}
                    <span className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-[#f59e0b]" />
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#f59e0b] transition-transform duration-300 group-hover:scale-110">
                      {link.icon}
                    </span>
                    <span>{link.name}</span>
                    <span className="ml-auto text-blue-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[#0ea5e9]">
                      <ExternalIcon />
                    </span>
                  </a>
                );
              }

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === "/dashboard" || link.path === "/admin"}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-[#1e3a8a] shadow-sm shadow-blue-100/50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#1e3a8a]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        /* Vel Tech Red left indicator */
                        <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-[#b91c1c]" />
                      )}

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-300 ${
                          isActive
                            ? "scale-110 text-[#1e3a8a]"
                            : "group-hover:scale-110 group-hover:text-[#0ea5e9]"
                        }`}
                      >
                        {link.icon}
                      </span>

                      <span>{link.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* SYSTEM ACTIVE FOOTER */}
        <div className="shrink-0 p-5 pt-0">
          <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ea5e9] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0ea5e9]" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                System Active
              </p>
            </div>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-blue-700/80">
              Attendance synchronization is active.
            </p>
          </div>
        </div>
      </aside>

      {/* CUSTOM SCROLLBAR FOR SIDEBAR */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}