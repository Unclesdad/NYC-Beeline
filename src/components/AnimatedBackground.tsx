import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  theme: 'honey' | 'blue' | 'green';
  intensity?: 'low' | 'medium' | 'high';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, 
  theme = 'honey',
  intensity = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Define theme colors
  const themeColors = {
    honey: {
      primary: '#f59e0b', // amber-500
      secondary: '#fbbf24', // amber-400
      tertiary: '#fcd34d', // amber-300
      background: '#fffbeb', // amber-50
    },
    blue: {
      primary: '#3b82f6', // blue-500
      secondary: '#60a5fa', // blue-400
      tertiary: '#93c5fd', // blue-300
      background: '#eff6ff', // blue-50
    },
    green: {
      primary: '#10b981', // emerald-500
      secondary: '#34d399', // emerald-400
      tertiary: '#6ee7b7', // emerald-300
      background: '#ecfdf5', // emerald-50
    }
  };

  // Set particle count based on intensity
  const getParticleCount = () => {
    switch (intensity) {
      case 'low': return 20;
      case 'high': return 75;
      default: return 40; // medium
    }
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match window
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Create particles
    const colors = themeColors[theme];
    const particleColors = [colors.primary, colors.secondary, colors.tertiary];
    const particles: Particle[] = [];
    
    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off edges
        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
          this.speedX = -this.speedX;
        }
        
        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
          this.speedY = -this.speedY;
        }
      }
      
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }
    }
    
    // Initialize particles
    const init = () => {
      const particleCount = getParticleCount();
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    // Animate
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (theme === 'honey') {
        // Add hexagon patterns for honey theme
        drawHexagonPattern(ctx, canvas.width, canvas.height);
      }
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Connect particles with lines if they're close
        connectParticles(particles[i], particles);
      }
      
      requestAnimationFrame(animate);
    };
    
    // Connect particles with lines
    const connectParticles = (particle: Particle, particles: Particle[]) => {
      const maxDistance = 100;
      
      for (let i = 0; i < particles.length; i++) {
        const dx = particle.x - particles[i].x;
        const dy = particle.y - particles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = 0.2 * (1 - distance / maxDistance);
          ctx.lineWidth = 1;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particles[i].x, particles[i].y);
          ctx.stroke();
        }
      }
    };
    
    // Draw hexagon pattern for honey theme
    const drawHexagonPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const hexSize = 40;
      const hexWidth = hexSize * 2;
      const hexHeight = Math.sqrt(3) * hexSize;
      
      ctx.strokeStyle = themeColors.honey.tertiary;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.1;
      
      for (let y = -hexHeight; y < height + hexHeight; y += hexHeight) {
        for (let x = -hexWidth; x < width + hexWidth; x += hexWidth * 1.5) {
          // Draw hexagons in a staggered pattern
          const offsetY = Math.floor(x / (hexWidth * 1.5)) % 2 === 0 ? 0 : hexHeight / 2;
          
          drawHexagon(ctx, x, y + offsetY, hexSize);
        }
      }
    };
    
    // Draw a single hexagon
    const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i;
        const xPos = x + size * Math.cos(angle);
        const yPos = y + size * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.closePath();
      ctx.stroke();
    };
    
    init();
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [theme, intensity]);
  
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: themeColors[theme].background }}>
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full" 
        style={{ pointerEvents: 'none' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AnimatedBackground; 