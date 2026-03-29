import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ParticleCanvasProps {
  className?: string;
  particleCount?: number;
  theme?: 'light' | 'dark';
}

export const ParticleCanvas = ({ 
  className = '', 
  particleCount = 80,
  theme = 'light'
}: ParticleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const createParticle = useCallback((width: number, height: number): Particle => {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    };
  }, []);

  const initParticles = useCallback((width: number, height: number) => {
    particlesRef.current = Array.from({ length: particleCount }, () => 
      createParticle(width, height)
    );
  }, [particleCount, createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      initParticles(canvas.offsetWidth, canvas.offsetHeight);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((particle) => {
        // Subtle mouse interaction (parallax)
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          particle.x -= dx * force * 0.008;
          particle.y -= dy * force * 0.008;
        }

        // Update position (very slow floating)
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Twinkle effect
        const twinkle = Math.sin(time * particle.twinkleSpeed + particle.twinkleOffset);
        const currentOpacity = particle.opacity * (0.6 + twinkle * 0.4);

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Theme-based colors
        if (theme === 'dark') {
          // Gold dust for dark theme
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          gradient.addColorStop(0, `rgba(212, 175, 55, ${currentOpacity})`);
          gradient.addColorStop(0.5, `rgba(218, 165, 32, ${currentOpacity * 0.6})`);
          gradient.addColorStop(1, `rgba(184, 134, 11, 0)`);
          ctx.fillStyle = gradient;
        } else {
          // Crystal/white dots for light theme
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
          gradient.addColorStop(0.5, `rgba(200, 210, 230, ${currentOpacity * 0.5})`);
          gradient.addColorStop(1, `rgba(150, 170, 200, 0)`);
          ctx.fillStyle = gradient;
        }
        
        ctx.fill();
      });

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'overlay' }}
    />
  );
};