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
    <div className="relative w-full overflow-hidden rounded-[24px] border border-rose-200/60 bg-white/60 backdrop-blur-md p-6 shadow-lg shadow-rose-900/5 sm:p-8 animate-[fadeInUp_0.4s_ease-out_forwards]">
      
      {/* Ambient Pulsing Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/15 blur-[40px] animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-rose-400/10 blur-[30px]" />

      <div className="relative z-10 flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
        
        {/* Warning Icon Container */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-200/50 bg-white/80 shadow-sm shadow-rose-100/50 backdrop-blur-sm sm:h-14 sm:w-14">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 sm:h-10 sm:w-10">
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
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

        {/* Text & Actions */}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold tracking-tight text-rose-900 sm:text-xl drop-shadow-sm">
            Unable to load data
          </h3>

          <p className="mt-2 break-words text-sm font-medium leading-relaxed text-rose-700/90 sm:text-[15px]">
            {errorMessage}
          </p>

          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/40 active:translate-y-0 active:scale-95 sm:mt-7"
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
      
      {/* Inject Keyframe for Entrance Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}