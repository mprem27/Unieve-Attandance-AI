import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";
  const homeRoute = isAdmin ? "/admin" : "/dashboard";

  const displayName = user?.name || "User";
  const roleLabel = isAdmin ? "Administrator" : "Student";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 shadow-[0_4px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl">
      <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="group rounded-xl p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-90"
              aria-label="Open navigation menu"
              aria-controls="sidebar"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h10M4 18h16"
                />
              </svg>
            </button>
          )}

          <Link
            to={homeRoute}
            className="group flex items-center gap-2.5 transition-transform active:scale-95 sm:gap-3"
            aria-label="UniEve AI home"
          >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 transition-all group-hover:shadow-md group-hover:ring-indigo-500/20 sm:h-10 sm:w-10">
              <img
                src="/logo.png"
                alt="UniEve AI"
                className="h-5 w-5 object-contain transition-transform duration-500 group-hover:scale-110 sm:h-6 sm:w-6"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <span className="absolute text-xs font-black text-indigo-600 sm:text-sm">
                UA
              </span>
            </div>

            <div>
              <h1 className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-base font-black tracking-tight text-transparent sm:text-lg">
                UniEve AI
              </h1>
            </div>
          </Link>
        </div>

        <div className="hidden flex-1 lg:block" />

        <div className="flex items-center gap-1.5 sm:gap-3">

          <Link
            to="/notifications"
            className="relative rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95 sm:p-2.5"
            aria-label="Notifications"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2a2 2 0 01-.6 1.4L4 17h5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 21h4"
              />
            </svg>
          </Link>

          <div className="hidden h-8 w-px bg-slate-200/70 sm:block" />

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-2xl p-1 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95 sm:gap-3 sm:p-1.5 sm:pr-3"
            aria-label="Open profile"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-inner ring-2 ring-white sm:h-9 sm:w-9 sm:text-sm">
              {initial}
            </div>

            <div className="hidden max-w-[140px] text-left md:block">
              <p className="truncate text-sm font-bold leading-tight text-slate-700">
                {displayName}
              </p>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {roleLabel}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="group flex items-center gap-2 rounded-xl p-2 text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 active:scale-95 sm:px-3 sm:py-2.5"
            aria-label="Logout"
          >
            <span className="hidden text-sm font-bold sm:block">
              Logout
            </span>

            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}