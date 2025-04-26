import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  theme: 'honey' | 'blue' | 'green';
  intensity?: 'low' | 'medium' | 'high';
  pattern?: 'hexagon' | 'circles' | 'dots' | 'none';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, 
  theme = 'honey',
  intensity = 'medium',
  pattern = 'hexagon'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Define theme colors with enhanced gradients
  const themeColors = {
    honey: {
      primary: '#f59e0b', // amber-500
      secondary: '#fbbf24', // amber-400
      tertiary: '#fcd34d', // amber-300
      accent: '#d97706', // amber-600
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', // amber-50 to amber-100
    },
    blue: {
      primary: '#3b82f6', // blue-500
      secondary: '#60a5fa', // blue-400
      tertiary: '#93c5fd', // blue-300
      accent: '#2563eb', // blue-600
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', // blue-50 to blue-100
    },
    green: {
      primary: '#10b981', // emerald-500
      secondary: '#34d399', // emerald-400
      tertiary: '#6ee7b7', // emerald-300
      accent: '#059669', // emerald-600
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', // emerald-50 to emerald-100
    }
  };

  // Set particle count based on intensity
  const getParticleCount = () => {
    switch (intensity) {
      case 'low': return 30;
      case 'high': return 100;
      default: return 60; // medium
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
    const particleColors = [colors.primary, colors.secondary, colors.tertiary, colors.accent];
    const particles: Particle[] = [];
    
    // Enhanced Particle class with improved animation
    class Particle {
      x: number;
      y: number;
      size: number;
      baseSize: number;
      speedX: number;
      speedY: number;
      color: string;
      pulseFactor: number;
      pulseSpeed: number;
      opacity: number;
      
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseSize = Math.random() * 5 + 2;
        this.size = this.baseSize;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.pulseFactor = 0;
        this.pulseSpeed = Math.random() * 0.05 + 0.01;
        this.opacity = Math.random() * 0.5 + 0.3;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Smooth pulsing effect
        this.pulseFactor += this.pulseSpeed;
        this.size = this.baseSize + Math.sin(this.pulseFactor) * 0.8;
        
        // Bounce off edges with slight randomization
        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
          this.speedX = -this.speedX * (0.9 + Math.random() * 0.2);
          this.speedY += (Math.random() - 0.5) * 0.1; // Add slight randomness
        }
        
        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
          this.speedY = -this.speedY * (0.9 + Math.random() * 0.2);
          this.speedX += (Math.random() - 0.5) * 0.1; // Add slight randomness
        }
        
        // Ensure particles don't slow down too much
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (speed < 0.1) {
          const boost = 0.2 + Math.random() * 0.3;
          this.speedX = this.speedX / speed * boost;
          this.speedY = this.speedY / speed * boost;
        }
      }
      
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
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
      
      // Draw background patterns based on selected pattern
      if (pattern === 'hexagon' && theme === 'honey') {
        drawHexagonPattern(ctx, canvas.width, canvas.height);
      } else if (pattern === 'circles') {
        drawCirclePattern(ctx, canvas.width, canvas.height);
      } else if (pattern === 'dots') {
        drawDotPattern(ctx, canvas.width, canvas.height);
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
    
    // Connect particles with lines - enhanced version
    const connectParticles = (particle: Particle, particles: Particle[]) => {
      const maxDistance = intensity === 'high' ? 150 : 
                          intensity === 'medium' ? 120 : 80;
      
      for (let i = 0; i < particles.length; i++) {
        const dx = particle.x - particles[i].x;
        const dy = particle.y - particles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          // Create gradient lines for better visual effect
          const gradient = ctx.createLinearGradient(
            particle.x, particle.y, 
            particles[i].x, particles[i].y
          );
          
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, particles[i].color);
          
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.globalAlpha = 0.3 * (1 - distance / maxDistance);
          ctx.lineWidth = 0.8;
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
      ctx.globalAlpha = 0.15;
      
      for (let y = -hexHeight; y < height + hexHeight; y += hexHeight) {
        for (let x = -hexWidth; x < width + hexWidth; x += hexWidth * 1.5) {
          // Draw hexagons in a staggered pattern
          const offsetY = Math.floor(x / (hexWidth * 1.5)) % 2 === 0 ? 0 : hexHeight / 2;
          
          drawHexagon(ctx, x, y + offsetY, hexSize);
        }
      }
    };
    
    // Draw circle pattern
    const drawCirclePattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const circleRadius = 50;
      const circleSpacing = 120;
      
      ctx.strokeStyle = themeColors[theme].tertiary;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.1;
      
      for (let y = -circleRadius; y < height + circleRadius; y += circleSpacing) {
        for (let x = -circleRadius; x < width + circleRadius; x += circleSpacing) {
          // Add some variance to circle positions
          const offsetX = Math.sin(y * 0.1) * 20;
          const offsetY = Math.cos(x * 0.1) * 20;
          
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, circleRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Add smaller inner circle
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, circleRadius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };
    
    // Draw dot pattern
    const drawDotPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const dotSpacing = 40;
      const dotRadius = 1;
      
      ctx.fillStyle = themeColors[theme].tertiary;
      ctx.globalAlpha = 0.2;
      
      for (let y = 0; y < height; y += dotSpacing) {
        for (let x = 0; x < width; x += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
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
  }, [theme, intensity, pattern]);
  
  // Get the background color based on theme
  const getBackgroundStyle = () => {
    const bgColor = theme === 'honey' ? '#fffbeb' : 
                    theme === 'blue' ? '#eff6ff' : 
                    '#ecfdf5';
    
    // Use gradient for enhanced look
    const gradient = themeColors[theme].background;
    
    return { background: gradient };
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden" style={getBackgroundStyle()}>
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