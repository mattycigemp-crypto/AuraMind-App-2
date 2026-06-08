import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TechGridBackgroundProps {
  className?: string;
}

const TechGridBackground: React.FC<TechGridBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      time += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 60;
      const offsetX = (time * 10) % gridSize;
      const offsetY = (time * 5) % gridSize;

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
      ctx.lineWidth = 1;

      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.03)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.02)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.03)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export { TechGridBackground };

interface GridDotPatternProps {
  className?: string;
}

const GridDotPattern: React.FC<GridDotPatternProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 opacity-[0.03] pointer-events-none ${className}`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(99, 102, 241, 1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  );
};

export { GridDotPattern };


