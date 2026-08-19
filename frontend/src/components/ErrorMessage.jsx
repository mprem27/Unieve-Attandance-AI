import React from "react";

export default function ErrorMessage({
  message = "Something went wrong.",
  onRetry,
}) {
  const errorMessage =
    typeof message === "string" && message.trim()
      ? message
      : "Something went wrong. Please try again.";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/50 to-white p-5 shadow-[0_8px_30px_rgb(225,29,72,0.04)] sm:rounded-3xl sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl" />

      <div className="relative flex items-start gap-4 sm:gap-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white shadow-sm shadow-rose-100/50 sm:h-14 sm:w-14 sm:rounded-2xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 sm:h-10 sm:w-10 sm:rounded-xl">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight text-rose-900 sm:text-lg">
            Unable to load data
          </h3>

          <p className="mt-1.5 break-words text-xs font-medium leading-relaxed text-rose-700/80 sm:text-sm">
            {errorMessage}
          </p>

          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/40 active:translate-y-0 active:scale-[0.98] sm:mt-6 sm:px-5 sm:text-sm"
            >
              <svg
                className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>

              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}