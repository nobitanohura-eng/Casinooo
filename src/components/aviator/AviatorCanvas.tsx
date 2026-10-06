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
      height = 230; // Compact casino touch viewport
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

      // 1. Dark Atmospheric Runway Gradient (Zero Math Grid / No Graph Paper)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#060a14');
      skyGrad.addColorStop(0.65, '#0a101f');
      skyGrad.addColorStop(1, '#0e172a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Solid Runway Ground Baseline at bottom
      const baselineY = height - 20;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();

      // Ground runway markings
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let rx = 10; rx < width; rx += 45) {
        ctx.fillRect(rx, baselineY + 5, 20, 2);
      }

      // Faint horizontal altitude dashed guidelines that smoothly scale as the plane climbs
      const mult = displayMultiplierRef.current;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      const altitudeLevels = [1.5, 2.0, 3.0, 5.0, 10.0];
      for (const alt of altitudeLevels) {
        const prog = Math.min(1.0, Math.log(alt) / Math.log(6.0));
        const altY = baselineY - (height - 65) * Math.min(0.9, Math.pow(prog, 0.75));
        if (altY > 20 && altY < baselineY) {
          ctx.beginPath();
          ctx.moveTo(0, altY);
          ctx.lineTo(width, altY);
          ctx.stroke();

          // Altitude label on right
          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.font = '700 9px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${alt.toFixed(1)}x`, width - 8, altY - 3);
        }
      }
      ctx.setLineDash([]); // Reset line dash

      // 2. Flight Trajectory or Waiting State
      if (status === 'BETTING') {
        displayMultiplierRef.current = 1.0;
        particlesRef.current = [];

        // Radar pulsing beacon
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.15 + 0.25 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 10, 42 + 8 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Waiting state overlay: Ultra-bold casino condensed sans
        ctx.fillStyle = '#94a3b8';
        ctx.font = '900 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PREPARING FOR TAKEOFF', width / 2, height / 2 - 25);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 24px Inter, sans-serif';
        ctx.fillText(
          `NEXT ROUND IN ${bettingCountdownSeconds ?? 5}s`,
          width / 2,
          height / 2 + 5
        );
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

        // Glowing gradient fill underneath the curved flight path
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
        ctx.lineTo(targetX, baselineY);
        ctx.lineTo(startX, baselineY);
        ctx.closePath();

        const glowGradient = ctx.createLinearGradient(0, targetY, 0, baselineY);
        glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        glowGradient.addColorStop(0.5, 'rgba(225, 29, 72, 0.12)');
        glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // High-glow illuminated neon flight path stroke
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ef4444';
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
            color: Math.random() > 0.4 ? '#ef4444' : '#fbbf24',
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

        // Heavy Casino Multiplier: Ultra-Bold Condensed Sans with Metallic Sheen
        const multText = `${currentMult.toFixed(2)}x`;
        ctx.font = '900 48px Inter, sans-serif';
        ctx.textAlign = 'center';

        // Outer shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;

        // Metallic gradient text fill
        const textGrad = ctx.createLinearGradient(0, height / 2 - 35, 0, height / 2 + 15);
        textGrad.addColorStop(0, '#ffffff');
        textGrad.addColorStop(0.35, '#fef08a');
        textGrad.addColorStop(0.7, '#eab308');
        textGrad.addColorStop(1, '#a16207');
        ctx.fillStyle = textGrad;
        ctx.fillText(multText, width / 2, height / 2 - 8);
        ctx.shadowBlur = 0; // reset
        ctx.shadowOffsetY = 0;
      } else if (status === 'CRASHED') {
        const crashedAt = crashMultiplier || displayMultiplierRef.current;

        // Subtle flash overlay right after crash (fading over 350ms)
        if (crashElapsed < 350) {
          const flashAlpha = ((350 - crashElapsed) / 350) * 0.45;
          ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha})`;
          ctx.fillRect(0, 0, width, height);
        }

        // FLEW AWAY label
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 10;
        ctx.fillText('FLEW AWAY', width / 2, height / 2 - 22);
        ctx.shadowBlur = 0;

        // Metallic Red Crashed Multiplier
        const crashText = `${crashedAt.toFixed(2)}x`;
        ctx.font = '900 48px Inter, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;

        const redGrad = ctx.createLinearGradient(0, height / 2 - 5, 0, height / 2 + 45);
        redGrad.addColorStop(0, '#ffffff');
        redGrad.addColorStop(0.4, '#fca5a5');
        redGrad.addColorStop(0.8, '#ef4444');
        redGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = redGrad;
        ctx.fillText(crashText, width / 2, height / 2 + 25);
        ctx.shadowBlur = 0;
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
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-700/60 bg-[#070b14] shadow-md">
      <canvas ref={canvasRef} className="block w-full touch-none select-none" />
    </div>
  );
};

// Helper: Vector drawing of Red Monoplane with spinning propeller
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
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(18, 0); // Nose cone
  ctx.quadraticCurveTo(8, -5, -16, -4); // Top spine
  ctx.lineTo(-24, -2); // Tail base
  ctx.lineTo(-24, 2);
  ctx.quadraticCurveTo(8, 5, 18, 0); // Belly
  ctx.closePath();
  ctx.fill();

  // Glass Cockpit Canopy
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.moveTo(4, -4);
  ctx.quadraticCurveTo(8, -7, 12, -3);
  ctx.lineTo(6, -1);
  ctx.closePath();
  ctx.fill();

  // Main Swept Wing (Red with white top highlight)
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.lineTo(-6, -16);
  ctx.lineTo(-12, -15);
  ctx.lineTo(-6, -1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.lineTo(-6, -16);
  ctx.stroke();

  // Lower Wing
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(-6, 12);
  ctx.lineTo(-10, 11);
  ctx.lineTo(-4, 1);
  ctx.closePath();
  ctx.fill();

  // Tail Fin (Rudder)
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.lineTo(-26, -11);
  ctx.lineTo(-22, -11);
  ctx.lineTo(-14, -2);
  ctx.closePath();
  ctx.fill();

  // Spinning Propeller at Nose Cone
  const propPhase = (time * 0.05) % (Math.PI * 2);
  const propHeight = Math.sin(propPhase) * 12;
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, -propHeight);
  ctx.lineTo(18, propHeight);
  ctx.stroke();

  // Nose tip spinner hub
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(18, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
