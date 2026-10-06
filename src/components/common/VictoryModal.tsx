import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, X, CheckCircle, ArrowRight } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  game: 'Win Go 1Min' | 'Aviator';
  multiplier?: number;
  details?: string;
}

interface CoinParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  amount,
  game,
  multiplier,
  details,
}) => {
  const { t } = useTranslation();
  const [coins, setCoins] = useState<CoinParticle[]>([]);

  useEffect(() => {
    if (isOpen) {
      soundManager.play('win');
      // Generate 25 coin shower particles
      const newCoins: CoinParticle[] = Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        x: Math.random() * 92 + 4, // 4% to 96%
        delay: Math.random() * 0.4,
        duration: 1.2 + Math.random() * 0.9,
        size: 14 + Math.random() * 12,
        rotation: Math.random() * 360,
      }));
      setCoins(newCoins);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Falling Golden Coin Shower Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute -top-10 text-amber-300 font-black animate-coin-fall"
            style={{
              left: `${coin.x}%`,
              animationDelay: `${coin.delay}s`,
              animationDuration: `${coin.duration}s`,
              transform: `rotate(${coin.rotation}deg)`,
            }}
          >
            <div
              className="rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-100 border border-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/50"
              style={{ width: `${coin.size}px`, height: `${coin.size}px` }}
            >
              <span className="text-[9px] font-black text-slate-950 font-casino-num">₹</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Victory Card */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#131d33] via-[#0b101c] to-[#080d17] border-2 border-amber-400/60 rounded-xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.35)] animate-in zoom-in-95 duration-200">
        {/* Glow ambient background aura */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close victory alert"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy Crest */}
        <div className="relative mx-auto mb-3 w-16 h-16 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 flex items-center justify-center shadow-xl shadow-amber-500/30 border-t-2 border-white/60">
          <Trophy className="w-9 h-9 text-slate-950 fill-slate-950" />
          <Sparkles className="w-5 h-5 text-amber-200 absolute -top-1 -right-1 animate-ping" />
        </div>

        {/* Header Titles */}
        <div className="inline-block bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 font-casino-num">
            VICTORY SETTLEMENT
          </span>
        </div>

        <h2 className="text-xl font-black text-white tracking-tight leading-tight uppercase font-display">
          🎉 {t('congrats')}
        </h2>
        <p className="text-xs font-semibold text-amber-400/90 mt-0.5">
          {game} · {details || (multiplier ? `${multiplier.toFixed(2)}x Multiplier Claimed` : 'Authoritative Payout')}
        </p>

        {/* Big Metallic Win Amount */}
        <div className="my-5 p-3.5 rounded-lg bg-[#070b14] border border-amber-500/30 shadow-inner">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('youWon')}
          </span>
          <div className="text-4xl font-black text-amber-300 tracking-tight font-casino-num metallic-gold-text mt-1">
            {formatINR(amount)}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold block mt-1">
            ✓ Credited Instantly to Vault Balance
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-98 transition-transform border-t border-white/40"
        >
          <span>Claim Winnings</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      <style>{`
        @keyframes coin-fall {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(540deg);
            opacity: 0;
          }
        }
        .animate-coin-fall {
          animation: coin-fall cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};
