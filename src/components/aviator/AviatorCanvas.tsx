import React, { useEffect, useRef } from 'react';
import { AviatorRoundStatus } from '../../lib/types.ts';

interface AviatorCanvasProps {
  status: AviatorRoundStatus;
  currentMultiplier: number;
  bettingCountdownSeconds?: number;
  crashMultiplier?: number | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export const AviatorCanvas: React.FC<AviatorCanvasProps> = ({
  status,
  currentMultiplier,
  bettingCountdownSeconds,
  crashMultiplier,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth interpolation target
  const targetMultiplierRef = useRef<number>(currentMultiplier);
  const displayMultiplierRef = useRef<number>(currentMultiplier);
  const particlesRef = useRef<Particle[]>([]);

  // Crash visual effect tracking
  const prevStatusRef = useRef<AviatorRoundStatus>(status);
  const crashEffectStartRef = useRef<number>(0);

  useEffect(() => {
    targetMultiplierRef.current = currentMultiplier;
  }, [currentMultiplier]);

  useEffect(() => {
    if (prevStatusRef.current !== 'CRASHED' && status === 'CRASHED') {
      crashEffectStartRef.current = performance.now();
    }
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = Math.max(220, Math.min(320, parent.clientWidth * 0.52));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.save();

      // Screen Shake Effect on Crash (lasts 450ms)
      const crashElapsed = time - crashEffectStartRef.current;
      let shakeX = 0;
      let shakeY = 0;
      if (status === 'CRASHED' && crashElapsed < 450) {
        const shakeDecay = (450 - crashElapsed) / 450;
        shakeX = (Math.random() - 0.5) * 12 * shakeDecay;
        shakeY = (Math.random() - 0.5) * 12 * shakeDecay;
        ctx.translate(shakeX, shakeY);
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Spribe Deep Space Background Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0a0a0c');
      skyGrad.addColorStop(0.7, '#0e0f12');
      skyGrad.addColorStop(1, '#141518');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Baseline at bottom
      const baselineY = height - 24;
      ctx.strokeStyle = '#1e2024';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();

      // Faint horizontal altitude dashed guidelines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);

      const altitudeLevels = [1.5, 2.0, 3.0, 5.0, 10.0];
      for (const alt of altitudeLevels) {
        const prog = Math.min(1.0, Math.log(alt) / Math.log(6.0));
        const altY = baselineY - (height - 65) * Math.min(0.9, Math.pow(prog, 0.75));
        if (altY > 20 && altY < baselineY) {
          ctx.beginPath();
          ctx.moveTo(0, altY);
          ctx.lineTo(width, altY);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]); // Reset line dash

      // 2. Flight Trajectory or Waiting State
      if (status === 'BETTING') {
        displayMultiplierRef.current = 1.0;
        particlesRef.current = [];

        const countdown = bettingCountdownSeconds ?? 5;
        const progress = Math.max(0, Math.min(1, 1 - countdown / 5));

        // Spribe "WAITING FOR NEXT ROUND" text
        ctx.fillStyle = '#83878e';
        ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WAITING FOR NEXT ROUND', width / 2, height / 2 - 20);

        // Spribe Red Progress Bar
        const barW = Math.min(220, width * 0.6);
        const barH = 5;
        const barX = width / 2 - barW / 2;
        const barY = height / 2 - 5;

        // Track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        // Fill
        const fillW = Math.max(8, barW * (1 - countdown / 5));
        ctx.fillStyle = '#e5053a';
        ctx.shadowColor = 'rgba(229, 5, 58, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Subtitle countdown
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`Starting in ${countdown}s`, width / 2, height / 2 + 20);

      } else if (status === 'FLYING') {
        // Interpolate smoothly towards authoritative target
        displayMultiplierRef.current +=
          (targetMultiplierRef.current - displayMultiplierRef.current) * 0.22;

        const currentMult = displayMultiplierRef.current;

        // Calculate progress along curved trajectory
        const progress = Math.min(1.0, Math.log(currentMult) / Math.log(5.0));

        const startX = 20;
        const startY = baselineY;
        const targetX = startX + (width - 70) * Math.min(1.0, progress * 1.15);
        const targetY = startY - (height - 65) * Math.min(0.9, Math.pow(progress, 0.75));

        // Control point for smooth quadratic curve
        const controlX = startX + (targetX - startX) * 0.55;
        const controlY = startY;

        // Calculate slope tangent angle theta along curve at current flight point
        const tVal = 0.98;
        const dX = 2 * (1 - tVal) * (controlX - startX) + 2 * tVal * (targetX - controlX);
        const dY = 2 * (1 - tVal) * (controlY - startY) + 2 * tVal * (targetY - controlY);
        const slopeAngle = Math.atan2(dY, dX);

        // Glowing red gradient fill underneath the curved flight path
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
        ctx.lineTo(targetX, baselineY);
        ctx.lineTo(startX, baselineY);
        ctx.closePath();

        const glowGradient = ctx.createLinearGradient(0, targetY, 0, baselineY);
        glowGradient.addColorStop(0, 'rgba(229, 5, 58, 0.42)');
        glowGradient.addColorStop(0.5, 'rgba(229, 5, 58, 0.15)');
        glowGradient.addColorStop(1, 'rgba(229, 5, 58, 0.0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // High-glow illuminated red flight path stroke
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
        ctx.strokeStyle = '#e5053a';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#e5053a';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset blur

        // Flame Trail Particles
        if (Math.random() < 0.75) {
          particlesRef.current.push({
            x: targetX - 16 * Math.cos(slopeAngle),
            y: targetY - 16 * Math.sin(slopeAngle),
            vx: -35 * Math.cos(slopeAngle) + (Math.random() - 0.5) * 15,
            vy: -35 * Math.sin(slopeAngle) + (Math.random() - 0.5) * 15,
            alpha: 1.0,
            size: 2.5 + Math.random() * 3.5,
            color: Math.random() > 0.4 ? '#e5053a' : '#ff7100',
          });
        }

        // Render flame particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha -= dt * 2.2;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Render Red Monoplane Aircraft rotated along curve slope
        drawMonoplane(ctx, targetX, targetY, slopeAngle, time);

        // Authentic Spribe Multiplier Display in Center
        const multText = `${currentMult.toFixed(2)}x`;
        ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';

        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(multText, width / 2, height / 2);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

      } else if (status === 'CRASHED') {
        const crashedAt = crashMultiplier || displayMultiplierRef.current;

        // Subtle flash overlay right after crash (fading over 350ms)
        if (crashElapsed < 350) {
          const flashAlpha = ((350 - crashElapsed) / 350) * 0.35;
          ctx.fillStyle = `rgba(229, 5, 58, ${flashAlpha})`;
          ctx.fillRect(0, 0, width, height);
        }

        // FLEW AWAY label (exact Spribe style)
        ctx.fillStyle = '#e5053a';
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(229, 5, 58, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText('FLEW AWAY', width / 2, height / 2 - 18);
        ctx.shadowBlur = 0;

        // Crashed Multiplier text in red
        const crashText = `${crashedAt.toFixed(2)}x`;
        ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#e5053a';
        ctx.fillText(crashText, width / 2, height / 2 + 35);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, bettingCountdownSeconds, crashMultiplier]);

  return (
    <div className="relative w-full overflow-hidden rounded-[20px] border border-[#2a2b2e] bg-[#000000] shadow-2xl">
      <canvas ref={canvasRef} className="block w-full touch-none select-none" />

      {/* Active Players Widget in bottom-left */}
      <div className="spribe-active-players-badge">
        <div className="flex items-center">
          <img src="/assets/avatars/av-70.png" alt="P" className="w-4 h-4 rounded-full border border-black z-30" />
          <img src="/assets/avatars/av-31.png" alt="P" className="w-4 h-4 rounded-full border border-black -ml-1.5 z-20" />
          <img src="/assets/avatars/av-48.png" alt="P" className="w-4 h-4 rounded-full border border-black -ml-1.5 z-10" />
        </div>
        <span className="spribe-players-count">522</span>
      </div>
    </div>
  );
};

// Helper: Vector drawing of Red Spribe Monoplane with spinning propeller
function drawMonoplane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Fuselage (Streamlined Aircraft Body)
  ctx.fillStyle = '#e5053a';
  ctx.beginPath();
  ctx.moveTo(22, 0); // Nose cone
  ctx.quadraticCurveTo(10, -6, -20, -5); // Top spine
  ctx.lineTo(-30, -3); // Tail base
  ctx.lineTo(-30, 3);
  ctx.quadraticCurveTo(10, 6, 22, 0); // Bottom hull
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy (glossy white/tint reflection)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(3, -3, 8, 3, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Wings (Swept monoplane main wing)
  ctx.fillStyle = '#c70432';
  ctx.beginPath();
  ctx.moveTo(8, -2);
  ctx.lineTo(-12, -18);
  ctx.lineTo(-18, -18);
  ctx.lineTo(-8, -2);
  ctx.closePath();
  ctx.fill();

  // Wing highlight edge
  ctx.strokeStyle = '#ff4d73';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8, -2);
  ctx.lineTo(-12, -18);
  ctx.stroke();

  // Tail Fin (Vertical Stabilizer)
  ctx.fillStyle = '#b3032c';
  ctx.beginPath();
  ctx.moveTo(-24, -3);
  ctx.lineTo(-34, -14);
  ctx.lineTo(-28, -14);
  ctx.lineTo(-18, -3);
  ctx.closePath();
  ctx.fill();

  // Spinning Propeller at Nose
  const propSpin = (time * 0.05) % (Math.PI * 2);
  ctx.save();
  ctx.translate(22, 0);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 2, 10 + 2 * Math.sin(propSpin), 0, 0, Math.PI * 2);
  ctx.fill();

  // Propeller Hub
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
