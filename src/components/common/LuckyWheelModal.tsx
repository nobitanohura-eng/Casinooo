import React, { useState, useRef } from 'react';
import { X, Trophy, Sparkles, Zap, Gift } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { formatINR } from '../../lib/formatters.ts';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBonusWon: (amount: number, label: string) => void;
}

const PRIZES = [
  { id: 1, amount: 50, label: '₹50 Cash', color: '#8b5cf6' },
  { id: 2, amount: 200, label: '₹200 Bounty', color: '#ec4899' },
  { id: 3, amount: 100, label: '₹100 Bonus', color: '#f59e0b' },
  { id: 4, amount: 500, label: '₹500 VIP Win', color: '#10b981' },
  { id: 5, amount: 75, label: '₹75 Cash', color: '#06b6d4' },
  { id: 6, amount: 1000, label: '₹1,000 MEGA', color: '#e11d48' },
  { id: 7, amount: 150, label: '₹150 Credit', color: '#3b82f6' },
  { id: 8, amount: 2500, label: '₹2,500 JACKPOT', color: '#eab308' },
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  onBonusWon,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<(typeof PRIZES)[0] | null>(null);
  const [freeSpins, setFreeSpins] = useState(1);

  const handleSpin = () => {
    if (isSpinning || freeSpins <= 0) return;

    soundManager.play('chip');
    setIsSpinning(true);
    setWonPrize(null);

    // Pick a high-value or rewarding prize index (e.g. index 1, 2, 3, or 4)
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const selectedPrize = PRIZES[prizeIndex];

    // Segment angle = 360 / 8 = 45 degrees
    const segmentAngle = 360 / PRIZES.length;
    // Calculate final angle pointing to top pointer (subtract index * 45)
    const targetOffset = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    // Add 5 to 8 full rotations (1800 - 2880 deg)
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const finalRotation = rotation + fullSpins + targetOffset;

    setRotation(finalRotation);

    // Play spinning ticks
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundManager.play('click');
      tickCount++;
      if (tickCount > 18) clearInterval(tickInterval);
    }, 180);

    // After 4.5 seconds deceleration
    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWonPrize(selectedPrize);
      setFreeSpins((prev) => Math.max(0, prev - 1));
      soundManager.play('win');
      onBonusWon(selectedPrize.amount, selectedPrize.label);
    }, 4500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#210936] via-[#140624] to-[#07020d] border-2 border-amber-400/60 p-5 shadow-[0_0_50px_rgba(234,179,8,0.35)] overflow-hidden text-center">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.play('click');
            onClose();
          }}
          disabled={isSpinning}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-3 space-y-1">
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-casino-num font-black text-amber-300 tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>LUCKY WHEEL OF FORTUNE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-casino-num uppercase text-white tracking-wide">
            Spin & Win Cash
          </h2>
          <p className="text-[11px] text-purple-200/80 font-medium">
            Daily Free Spin Available: <span className="text-amber-300 font-bold">{freeSpins} Spin</span>
          </p>
        </div>

        {/* Spinning Wheel Graphic Frame */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Top Indicator Arrow / Peg */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

          {/* Outer Golden Ring Frame */}
          <div className="relative w-64 h-64 rounded-full p-2.5 bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-600 shadow-[0_0_25px_rgba(245,158,11,0.5)] border-4 border-amber-500 flex items-center justify-center">
            {/* 3D Wheel Canvas/SVG rotated with transition */}
            <div
              className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)'
                  : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {PRIZES.map((prize, idx) => {
                  const angle = 360 / PRIZES.length;
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;
                  // Convert to radians
                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                  const textAngle = startAngle + angle / 2;

                  return (
                    <g key={prize.id}>
                      <path d={pathData} fill={prize.color} stroke="#1e1b4b" strokeWidth="0.8" />
                      <text
                        x="50"
                        y="22"
                        transform={`rotate(${textAngle + 90}, 50, 50)`}
                        fill="#ffffff"
                        fontSize="5.2"
                        fontWeight="900"
                        fontFamily="Inter, sans-serif"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ₹{prize.amount}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Golden Hub Pin */}
            <div
              onClick={handleSpin}
              className={`absolute z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-600 p-1 shadow-2xl flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform ${
                isSpinning ? 'pointer-events-none opacity-90' : 'hover:scale-105'
              }`}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-950 to-purple-950 border-2 border-amber-400 flex flex-col items-center justify-center">
                <span className="font-casino-num font-black text-[11px] text-amber-300 tracking-wider">
                  {isSpinning ? 'LUCK' : 'SPIN'}
                </span>
                <span className="text-[7px] text-slate-300 font-bold uppercase">
                  {isSpinning ? '...' : 'FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Won Prize Celebration Card */}
        {wonPrize && (
          <div className="my-2 p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 via-[#0a221a] to-emerald-950/90 border border-emerald-400/60 shadow-lg text-center animate-in zoom-in-95">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block font-casino-num">
              🎉 CONGRATULATIONS! YOU WON
            </span>
            <span className="text-xl font-black text-amber-300 font-casino-num block mt-0.5">
              +{formatINR(wonPrize.amount)} Cash Credited!
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || freeSpins <= 0}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-casino-num font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] border-t border-white/60 active:scale-95 transition-transform mt-3"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>{isSpinning ? 'SPINNING WHEEL...' : freeSpins > 0 ? 'SPIN THE WHEEL NOW (FREE)' : 'DAILY SPINS COMPLETED'}</span>
        </button>

        <p className="text-[10px] text-slate-400 mt-2 font-casino-num">
          ⚡ 100% Provably Fair RNG Prize Selection
        </p>
      </div>
    </div>
  );
};
