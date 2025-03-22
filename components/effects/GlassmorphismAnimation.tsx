'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * Glassmorphism animation creates subtle gradient movement in the background
 * This is a purely visual effect that's only rendered on the client side
 */
export default function GlassmorphismAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Create gradient blobs that move around
    const blobs = Array.from({ length: 3 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 300 + 100,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      hue: Math.random() * 360
    }));
    
    const isDark = theme === 'dark';
    
    // Animation function
    const animate = () => {
      // Clear canvas with a transparent fill to create trail effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw and update each blob
      blobs.forEach(blob => {
        // Move the blob
        blob.x += blob.dx;
        blob.y += blob.dy;
        
        // Bounce off edges
        if (blob.x < 0 || blob.x > canvas.width) blob.dx *= -1;
        if (blob.y < 0 || blob.y > canvas.height) blob.dy *= -1;
        
        // Create gradient for the blob
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        
        // Different colors for light/dark mode
        if (isDark) {
          gradient.addColorStop(0, `hsla(${blob.hue}, 70%, 60%, 0.05)`);
          gradient.addColorStop(1, `hsla(${blob.hue}, 70%, 60%, 0)`);
        } else {
          gradient.addColorStop(0, `hsla(${blob.hue}, 70%, 60%, 0.03)`);
          gradient.addColorStop(1, `hsla(${blob.hue}, 70%, 60%, 0)`);
        }
        
        // Draw the blob
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Slowly change color
        blob.hue = (blob.hue + 0.1) % 360;
      });
      
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [theme]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      aria-hidden="true"
    />
  );
} 