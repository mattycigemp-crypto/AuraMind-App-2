import { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface DashboardGlowBackgroundProps {
  className?: string;
}

const DashboardGlowBackground: React.FC<DashboardGlowBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

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
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient1X = Math.sin(time * 0.5) * 200 + canvas.width * 0.3;
      const gradient1Y = Math.cos(time * 0.3) * 100 + canvas.height * 0.3;

      const gradient1 = ctx.createRadialGradient(
        gradient1X,
        gradient1Y,
        0,
        gradient1X,
        gradient1Y,
        400
      );
      const isDark = resolvedTheme === 'dark';
      const glowAlpha1 = isDark ? 0.08 : 0.15;
      const glowAlpha2 = isDark ? 0.03 : 0.06;
      const glowAlpha3 = isDark ? 0.06 : 0.12;
      const glowAlpha4 = isDark ? 0.02 : 0.04;

      gradient1.addColorStop(0, `rgba(139, 92, 246, ${glowAlpha1})`);
      gradient1.addColorStop(0.5, `rgba(139, 92, 246, ${glowAlpha2})`);
      gradient1.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient2X = Math.cos(time * 0.4) * 150 + canvas.width * 0.7;
      const gradient2Y = Math.sin(time * 0.6) * 120 + canvas.height * 0.6;

      const gradient2 = ctx.createRadialGradient(
        gradient2X,
        gradient2Y,
        0,
        gradient2X,
        gradient2Y,
        300
      );
      gradient2.addColorStop(0, `rgba(99, 102, 241, ${glowAlpha3})`);
      gradient2.addColorStop(0.5, `rgba(99, 102, 241, ${glowAlpha4})`);
      gradient2.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient2;
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
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
};

export { DashboardGlowBackground };


