import React, { useEffect, useRef } from 'react';

export default function BackgroundAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let elements = [];
    
    // Balanced density for the larger 3D elements
    const maxElements = 45; 

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class AcademicElement {
      constructor() {
        this.reset();
        // Randomize starting Y anywhere on screen for initial load
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 100; // Start safely below bottom view
        
        // Larger sizes to show off the 3D details
        this.size = Math.random() * 25 + 20; 
        
        // Floating upwards
        this.speedY = -(Math.random() * 0.5 + 0.2); 
        this.speedX = (Math.random() - 0.5) * 0.3; 
        
        // HIGH OPACITY for bold visibility
        this.opacity = Math.random() * 0.20 + 0.80; 
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.01;

        // 🚀 NEW COLOR PALETTE (RGB Arrays for 3D processing)
        // 1. Pure Black, 2. Dark Royal Blue, 3. Crimson Red
        const palettes = [
          { r: 20, g: 25, b: 35 },   // Slate Black
          { r: 0, g: 51, b: 153 },   // Dark Blue
          { r: 185, g: 28, b: 28 }   // Dark Red
        ];
        this.color = palettes[Math.floor(Math.random() * palettes.length)];
        
        // 15 Different Motifs representing all categories requested
        this.type = Math.floor(Math.random() * 15);
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotSpeed;

        if (this.y < -120 || this.x < -120 || this.x > canvas.width + 120) {
          this.reset();
        }
      }

      drawShape(ctx, s) {
        // Renders the specific motif path/text
        switch(this.type) {
          // --- CS & IT MOTIFS ---
          case 0: // Binary Code
            ctx.font = `bold ${s}px monospace`;
            ctx.fillText("1010", -s*1.2, s/3);
            ctx.strokeText("1010", -s*1.2, s/3);
            break;
          case 1: // Code Brackets
            ctx.font = `bold ${s*1.2}px monospace`;
            ctx.fillText("{ }", -s, s/3);
            ctx.strokeText("{ }", -s, s/3);
            break;
          case 2: // Code Tags
            ctx.font = `900 ${s*1.2}px monospace`;
            ctx.fillText("</>", -s*1.2, s/3);
            ctx.strokeText("</>", -s*1.2, s/3);
            break;
          case 3: // Cloud Database
            ctx.beginPath();
            ctx.ellipse(0, -s/2, s, s/3, 0, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s/3, 0, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, s/2, s, s/3, 0, 0, Math.PI*2);
            ctx.stroke();
            break;

          // --- TRADITIONAL ACADEMIC ---
          case 4: // Grad Cap
            ctx.beginPath();
            ctx.moveTo(0, -s/2); ctx.lineTo(s, 0); ctx.lineTo(0, s/2); ctx.lineTo(-s, 0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s/2, s/4); ctx.quadraticCurveTo(0, s*0.8, s/2, s/4);
            ctx.stroke();
            break;
          case 5: // ID Badge
            let w = s * 1.4; let h = s * 2;
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.strokeRect(-w/2, -h/2, w, h);
            ctx.clearRect(-w/2 + 4, -h/2 + 4, w*0.4, h*0.4);
            ctx.beginPath();
            ctx.moveTo(-w/2 + w*0.55, -h/2 + 10); ctx.lineTo(w/2 - 6, -h/2 + 10);
            ctx.moveTo(-w/2 + w*0.55, -h/2 + 20); ctx.lineTo(w/2 - 6, -h/2 + 20);
            ctx.stroke();
            break;
          case 6: // Stacked Books
            ctx.fillRect(-s, -s/2, s*2, s/3); ctx.strokeRect(-s, -s/2, s*2, s/3);
            ctx.fillRect(-s*1.1, -s/6, s*2.2, s/3); ctx.strokeRect(-s*1.1, -s/6, s*2.2, s/3);
            ctx.fillRect(-s*0.9, s/6, s*1.8, s/3); ctx.strokeRect(-s*0.9, s/6, s*1.8, s/3);
            break;

          // --- ENGINEERING MOTIFS ---
          case 7: // Interlocking Gear
            ctx.beginPath();
            ctx.arc(0, 0, s*0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, s*0.2, 0, Math.PI * 2);
            ctx.fill();
            let teeth = 8;
            ctx.beginPath();
            for (let j = 0; j < teeth; j++) {
              let angle = (j / teeth) * Math.PI * 2;
              ctx.moveTo(Math.cos(angle) * s * 0.6, Math.sin(angle) * s * 0.6);
              ctx.lineTo(Math.cos(angle) * s * 0.9, Math.sin(angle) * s * 0.9);
            }
            ctx.stroke();
            break;
          case 8: // Orbiting Atom
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s/3, Math.PI/4, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s/3, -Math.PI/4, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, s/4, 0, Math.PI*2);
            ctx.fill();
            break;
          case 9: // Circuit Board Nodes
            ctx.beginPath();
            ctx.moveTo(-s, -s); ctx.lineTo(0,0); ctx.lineTo(s, -s/2);
            ctx.moveTo(0,0); ctx.lineTo(s/2, s);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-s, -s, s/4, 0, Math.PI*2);
            ctx.arc(s, -s/2, s/4, 0, Math.PI*2);
            ctx.arc(s/2, s, s/4, 0, Math.PI*2);
            ctx.fill();
            break;

          // --- MATH & CORE STEM ---
          case 10: // Infinity
            ctx.font = `bold ${s*1.8}px serif`;
            ctx.fillText("∞", -s, s/2);
            ctx.strokeText("∞", -s, s/2);
            break;
          case 11: // Pi Sign
            ctx.font = `bold ${s*1.5}px serif`;
            ctx.fillText("π", -s/1.5, s/2.5);
            ctx.strokeText("π", -s/1.5, s/2.5);
            break;
          case 12: // Sine Wave
            ctx.beginPath();
            ctx.moveTo(-s, 0);
            ctx.bezierCurveTo(-s/2, -s*1.5, s/2, s*1.5, s, 0);
            ctx.stroke();
            break;

          // --- CAMPUS LIFESTYLE ---
          case 13: // Wi-Fi Signal
            ctx.beginPath();
            ctx.arc(0, s/2, s, Math.PI*1.2, Math.PI*1.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, s/2, s*0.6, Math.PI*1.2, Math.PI*1.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, s/2, s*0.2, 0, Math.PI*2);
            ctx.fill();
            break;
          case 14: // Laptop
            ctx.strokeRect(-s, -s/2, s*2, s);
            ctx.fillRect(-s*1.2, s/2, s*2.4, s/4);
            break;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // 🚀 3D EXTRUSION EFFECT: Draw the same shape 6 times, offsetting it to create depth
        for (let i = 5; i >= 0; i--) {
          ctx.save();
          // Shift each layer slightly down and right to simulate 3D blockiness
          ctx.translate(i * 1.5, i * 1.5); 
          
          // Bottom layers are darker to simulate shadow/depth, top layer is bright
          const isTopLayer = (i === 0);
          
          // Make base color darker for the 3D shadow sides
          const depthMultiplier = isTopLayer ? 1 : 0.4;
          const r = Math.floor(this.color.r * depthMultiplier);
          const g = Math.floor(this.color.g * depthMultiplier);
          const b = Math.floor(this.color.b * depthMultiplier);
          
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
          ctx.fillStyle = isTopLayer ? `rgba(255, 255, 255, 0.1)` : `rgba(${r}, ${g}, ${b}, ${this.opacity})`; 
          
          // Ultra thick lines for bold cartoon 3D look
          ctx.lineWidth = isTopLayer ? 3.0 : 4.0;

          // Draw the actual path
          this.drawShape(ctx, this.size);
          
          ctx.restore();
        }
        
        ctx.restore();
      }
    }

    // Initialize elements
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

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]"
      style={{ backgroundColor: '#f8f9fb' }}
    />
  );
}