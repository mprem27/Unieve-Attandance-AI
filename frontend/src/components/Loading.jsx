import React, { useState } from "react";

// =====================================================
// DEFAULT LOGO
// =====================================================

const DEFAULT_LOGO = "/logo.png";

// =====================================================
// LOADING COMPONENT
// =====================================================

const Loading = ({
  size = "72px",
  fullPage = false,
  customLogo,
}) => {
  const [imgSrc, setImgSrc] = useState(
    customLogo || DEFAULT_LOGO
  );

  // =====================================================
  // IMAGE ERROR
  // =====================================================

  const handleImageError = () => {
    if (imgSrc !== DEFAULT_LOGO) {
      setImgSrc(DEFAULT_LOGO);
    }
  };

  // =====================================================
  // LOADER
  // =====================================================

  const loaderContent = (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 z-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"
        style={{
          animationDuration: "3s",
        }}
      />

      {/* Outer Track */}
      <div className="absolute inset-0 z-10 rounded-full border-2 border-slate-200/50 dark:border-slate-700/50" />

      {/* Outer Spinner */}
      <div
        className="absolute inset-0 z-20 rounded-full border-2 border-transparent border-r-indigo-600/30 border-t-indigo-600 animate-spin"
        style={{
          animationDuration: "1.2s",
        }}
      />

      {/* Inner Track */}
      <div className="absolute inset-[18%] z-10 rounded-full border-2 border-slate-200/50 dark:border-slate-700/50" />

      {/* Inner Spinner */}
      <div
        className="absolute inset-[18%] z-20 rounded-full border-2 border-transparent border-b-sky-400 border-l-sky-400/30 animate-spin"
        style={{
          animationDuration: "1.8s",
          animationDirection: "reverse",
        }}
      />

      {/* Logo */}
      <img
        src={imgSrc}
        alt="Loading"
        onError={handleImageError}
        className="absolute z-30 h-[45%] w-[45%] object-contain animate-pulse"
        style={{
          animationDuration: "2.5s",
          filter:
            "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))",
        }}
      />
    </div>
  );

  // =====================================================
  // FULL PAGE
  // =====================================================

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-white/90 backdrop-blur-xl dark:bg-slate-950/90">

        {/* Background Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vw] max-h-[600px] w-[60vw] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[100px]" />

        {loaderContent}

        {/* Loading Text */}
        <div className="relative z-10 mt-8 flex flex-col items-center gap-4">

          <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-800 dark:text-slate-200">
            Loading
          </p>

          <div className="flex gap-2">

            <span
              className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"
              style={{
                animationDelay: "0ms",
              }}
            />

            <span
              className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"
              style={{
                animationDelay: "200ms",
              }}
            />

            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"
              style={{
                animationDelay: "400ms",
              }}
            />

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NORMAL LOADER
  // =====================================================

  return loaderContent;
};

export default Loading;