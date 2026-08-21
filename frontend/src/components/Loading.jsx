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
  const [imgSrc, setImgSrc] = useState(customLogo || DEFAULT_LOGO);

  // =====================================================
  // IMAGE ERROR
  // =====================================================

  const handleImageError = () => {
    if (imgSrc !== DEFAULT_LOGO) {
      setImgSrc(DEFAULT_LOGO);
    }
  };

  // =====================================================
  // LOADER CORE ANIMATION (Clean & Smooth)
  // =====================================================

  const loaderContent = (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      {/* 1. Ambient Expanding Ripple Glow */}
      <div className="absolute inset-0 z-0 rounded-full bg-indigo-500/20 blur-md animate-[ripple_2s_ease-out_infinite]" />
      
      {/* 2. Static Background Tracks */}
      <div className="absolute inset-0 z-10 rounded-full border-[3px] border-slate-200/40 dark:border-slate-700/40" />
      <div className="absolute inset-[20%] z-10 rounded-full border-[2px] border-slate-200/40 dark:border-slate-700/40" />

      {/* 3. Smooth Outer Spinner (Indigo - Clockwise) */}
      <div
        className="absolute inset-0 z-20 rounded-full border-[3px] border-transparent border-t-indigo-600 animate-[spin_1.5s_linear_infinite]"
      />

      {/* 4. Smooth Inner Spinner (Sky Blue - Counter-Clockwise) */}
      <div
        className="absolute inset-[20%] z-20 rounded-full border-[2px] border-transparent border-b-sky-500 animate-[spin_2s_linear_infinite_reverse]"
      />

      {/* 5. Center Floating Logo */}
      <img
        src={imgSrc}
        alt="Loading"
        onError={handleImageError}
        className="absolute z-30 h-[45%] w-[45%] object-contain animate-[float_3s_ease-in-out_infinite]"
        style={{
          filter: "drop-shadow(0px 8px 12px rgba(0,0,0,0.15))",
        }}
      />
    </div>
  );

  // =====================================================
  // FULL PAGE WRAPPER
  // =====================================================

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-white/90 backdrop-blur-xl dark:bg-slate-950/90 transition-all duration-300">
        
        {/* INJECTED CUSTOM KEYFRAMES */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes ripple {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.02); }
          }
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes bounce-delay {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
        `}} />

        {/* Huge Ambient Background Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vw] max-h-[600px] w-[60vw] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-indigo-500/10 to-sky-400/10 blur-[100px] animate-pulse" />

        {/* Loader Graphics */}
        {loaderContent}

        {/* Loading Text & Dots */}
        <div className="relative z-10 mt-10 flex flex-col items-center gap-4">
          
          {/* Animated Gradient Text */}
          <p 
            className="text-xs font-black uppercase tracking-[0.4em] bg-gradient-to-r from-slate-400 via-indigo-600 to-slate-400 bg-[length:200%_auto] bg-clip-text text-transparent dark:from-slate-600 dark:via-sky-400 dark:to-slate-600"
            style={{ animation: 'shimmer 3s linear infinite' }}
          >
            Loading
          </p>

          {/* Staggered Bouncing Dots */}
          <div className="flex gap-2">
            <span
              className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              style={{ animation: "bounce-delay 1.4s infinite ease-in-out both", animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"
              style={{ animation: "bounce-delay 1.4s infinite ease-in-out both", animationDelay: "150ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              style={{ animation: "bounce-delay 1.4s infinite ease-in-out both", animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NORMAL LOADER RETURN
  // =====================================================

  return (
    <>
      {/* Inject keyframes for non-fullpage usage too */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
      `}} />
      {loaderContent}
    </>
  );
};

export default Loading;