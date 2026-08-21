import React, { useEffect, useState } from 'react';

// =====================================================
// 12 HIGH-QUALITY 2D VECTOR ICONS
// =====================================================
const ICONS = [
  // 1. Graduation cap
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 14L58 26L32 38L6 26L32 14Z" fill="currentColor"/><path d="M17 30V43C17 43 22 50 32 50C42 50 47 43 47 43V30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M54 27V41" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="54" cy="44" r="3.5" fill="currentColor"/></svg>`,
  // 2. ID card
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="13" width="48" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="22" cy="27" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 43C12 37 16.5 34 22 34C27.5 34 32 37 32 43" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="24" x2="49" y2="24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="31" x2="49" y2="31" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="38" x2="45" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  // 3. Open book
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 20C27 15 16 15 9 17V46C16 44 27 44 32 49C37 44 48 44 55 46V17C48 15 37 15 32 20Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><line x1="32" y1="20" x2="32" y2="49" stroke="currentColor" stroke-width="3"/></svg>`,
  // 4. Laptop with code brackets
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="13" y="14" width="38" height="25" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M25 21L20 26.5L25 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M39 21L44 26.5L39 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 47L13 39H51L58 47C58 48.5 56.5 49 55 49H9C7.5 49 6 48.5 6 47Z" fill="currentColor"/></svg>`,
  // 5. Pencil
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(45 32 32)"><rect x="27" y="8" width="10" height="32" fill="currentColor"/><rect x="27" y="4" width="10" height="6" fill="currentColor" opacity="0.6"/><path d="M27 40L32 52L37 40Z" fill="currentColor"/></g></svg>`,
  // 6. Diploma / certificate
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="16" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="17" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="17" cy="46" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="47" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="47" cy="46" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><line x1="24" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="24" y1="31" x2="40" y2="31" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="24" y1="37" x2="34" y2="37" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  // 7. Light bulb
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 8C22 8 15 15 15 24C15 30 18 34 21 37C23 39 24 41 24 44H40C40 41 41 39 43 37C46 34 49 30 49 24C49 15 42 8 32 8Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><line x1="25" y1="50" x2="39" y2="50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="27" y1="56" x2="37" y2="56" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  // 8. Circuit chip
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="24" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="none" stroke="currentColor" stroke-width="3"/><line x1="26" y1="20" x2="26" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="20" x2="32" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="20" x2="38" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="26" y1="44" x2="26" y2="53" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="44" x2="32" y2="53" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="44" x2="38" y2="53" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="26" x2="11" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="32" x2="11" y2="32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="38" x2="11" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="26" x2="53" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="32" x2="53" y2="32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="44" y1="38" x2="53" y2="38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  // 9. Science Atom
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26" ry="8" transform="rotate(45 32 32)" fill="none" stroke="currentColor" stroke-width="3"/><ellipse cx="32" cy="32" rx="26" ry="8" transform="rotate(-45 32 32)" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="currentColor"/></svg>`,
  // 10. Mechanical Gear
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 8v8m0 32v8m24-24h-8M16 32H8m20.5-17l-5.6-5.6m22.6 22.6l-5.6-5.6M49 49l-5.6-5.6M21.5 49l-5.6-5.6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  // 11. Code Brackets { }
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M26 12l-12 20 12 20M38 12l12 20-12 20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // 12. Database / Server Stack
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="18" rx="20" ry="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 18v28c0 4.4 9 8 20 8s20-3.6 20-8V18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 32c0 4.4 9 8 20 8s20-3.6 20-8" fill="none" stroke="currentColor" stroke-width="3"/></svg>`
];

// Dark, bold color palette
const COLORS = ['#0f172a', '#1e3a8a', '#7f1d1d', '#064e3b', '#4c1d95', '#000000'];
const ANIMS  = ['driftA', 'driftB', 'driftC', 'driftD'];

export default function BackgroundAnimation() {
  const [bgElements, setBgElements] = useState([]);
  const [fgElements, setFgElements] = useState([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    const bgCount = isMobile ? 25 : 45; // Items behind the cards
    const fgCount = isMobile ? 8 : 15;  // Items floating ON TOP

    const generateElements = (count, isForeground) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        // Background items are smaller and slightly more transparent
        // Foreground items are huge, dark, and highly visible
        const size = isForeground 
          ? 50 + Math.random() * 40   // 50px - 90px
          : 25 + Math.random() * 25;  // 25px - 50px
          
        const opacity = isForeground
          ? 0.4 + Math.random() * 0.4 // 40% - 80% opacity
          : 0.1 + Math.random() * 0.2; // 10% - 30% opacity

        const left = Math.random() * 100 + "%";
        const top = Math.random() * 100 + "%";
        
        // Foreground items move slightly faster
        const dur = isForeground 
          ? 15 + Math.random() * 15   // 15s - 30s
          : 25 + Math.random() * 20;  // 25s - 45s
          
        const delay = -Math.random() * dur; 
        const anim = ANIMS[Math.floor(Math.random() * ANIMS.length)];

        arr.push({ id: i, icon, color, size, left, top, opacity, anim, dur, delay });
      }
      return arr;
    };

    setBgElements(generateElements(bgCount, false));
    setFgElements(generateElements(fgCount, true));
  }, []);

  return (
    <>
      {/* CSS KEYFRAMES INJECTED GLOBALLY FOR SMOOTH DRIFTING */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes driftA {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(30px, -60px) rotate(15deg) scale(1.05); }
        }
        @keyframes driftB {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(-35px, -50px) rotate(-12deg) scale(0.95); }
        }
        @keyframes driftC {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(25px, -30px) rotate(8deg) scale(1.04); }
          66% { transform: translate(-20px, -60px) rotate(-8deg) scale(0.96); }
        }
        @keyframes driftD {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(0px, -80px) rotate(20deg) scale(1.1); }
        }
        .float-icon {
          position: absolute;
          will-change: transform;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .float-icon svg { 
          display: block; 
          width: 100%; 
          height: 100%; 
          overflow: visible; 
        }
        @media (prefers-reduced-motion: reduce){
          .float-icon { animation: none !important; }
        }
      `}} />

      {/* =========================================================================
          LAYER 1: BACKGROUND (Behind Dashboard)
          z-index: -1 so it sits behind everything.
          Also provides the #f8f9fb background color for the site.
      ========================================================================= */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none" 
        style={{ zIndex: -1, backgroundColor: '#f8f9fb' }}
        aria-hidden="true"
      >
        {bgElements.map((el) => (
          <div
            key={`bg-${el.id}`}
            className="float-icon"
            style={{
              width: `${el.size}px`,
              height: `${el.size}px`,
              left: el.left,
              top: el.top,
              color: el.color,
              opacity: el.opacity.toFixed(2),
              animation: `${el.anim} ${el.dur}s ${el.delay}s infinite ease-in-out`
            }}
            dangerouslySetInnerHTML={{ __html: el.icon }}
          />
        ))}
      </div>

      {/* =========================================================================
          LAYER 2: FOREGROUND (On Top of Dashboard)
          z-index: 9999 so it floats ON TOP of your cards.
          pointer-events: none ensures you can still click the buttons beneath it!
      ========================================================================= */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none" 
        style={{ zIndex: 9999 }}
        aria-hidden="true"
      >
        {fgElements.map((el) => (
          <div
            key={`fg-${el.id}`}
            className="float-icon"
            style={{
              width: `${el.size}px`,
              height: `${el.size}px`,
              left: el.left,
              top: el.top,
              color: el.color,
              opacity: el.opacity.toFixed(2),
              animation: `${el.anim} ${el.dur}s ${el.delay}s infinite ease-in-out`,
              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' // Adds slight shadow to top items
            }}
            dangerouslySetInnerHTML={{ __html: el.icon }}
          />
        ))}
      </div>
    </>
  );
}