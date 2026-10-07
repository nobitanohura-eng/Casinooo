import React from 'react';
import { Flame, Dices, Plane, Sparkles, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

interface Lottery7GameShelvesProps {
  onSelectGame: (game: 'aviator' | 'wingo') => void;
  winGoStatusText?: string;
  aviatorStatusText?: string;
}

export const Lottery7GameShelves: React.FC<Lottery7GameShelvesProps> = ({
  onSelectGame,
  winGoStatusText,
  aviatorStatusText,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. POPULAR SHELF */}
      <div className="l7-section-container">
        <div className="l7-section-header">
          <div className="l7-section-title">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Popular</span>
          </div>

          <div className="l7-section-more">
            <span>Detail</span>
            <div className="l7-section-arrows">
              <span className="l7-arrow-btn">
                <ChevronLeft className="w-3 h-3" />
              </span>
              <span className="l7-arrow-btn">
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* 2-Card Row for Popular Games */}
        <div className="l7-games-grid-2">
          {/* Card 1: Spribe Aviator */}
          <div
            onClick={() => onSelectGame('aviator')}
            className="l7-game-card group cursor-pointer"
          >
            <img
              src="/assets/lottery7/game-aviator.png"
              alt="Spribe Aviator"
              className="group-hover:scale-105 transition-transform duration-300"
            />
            {aviatorStatusText && (
              <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-amber-300 text-center py-0.5 rounded">
                {aviatorStatusText}
              </div>
            )}
          </div>

          {/* Card 2: Win Go */}
          <div
            onClick={() => onSelectGame('wingo')}
            className="l7-game-card group cursor-pointer"
          >
            <img
              src="/assets/lottery7/game-wingo.jpg"
              alt="Win Go 1Min"
              className="group-hover:scale-105 transition-transform duration-300"
            />
            {winGoStatusText && (
              <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-emerald-300 text-center py-0.5 rounded">
                {winGoStatusText}
              </div>
            )}
          </div>

          {/* Floating "Add to Desktop" pill badge right between them */}
          <div
            onClick={() => alert('Apex Arcade added to home screen!')}
            className="l7-add-desktop-floating"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add to Desktop</span>
          </div>
        </div>
      </div>

      {/* 2. LOTTERY SHELF */}
      <div className="l7-section-container">
        <div className="l7-section-header">
          <div className="l7-section-title">
            <Dices className="w-4 h-4 text-orange-500" />
            <span>Lottery</span>
          </div>

          <div className="l7-section-more">
            <span>Detail</span>
            <div className="l7-section-arrows">
              <span className="l7-arrow-btn">
                <ChevronLeft className="w-3 h-3" />
              </span>
              <span className="l7-arrow-btn">
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* 3-Card Row + 4th below */}
        <div className="grid grid-cols-3 gap-2">
          {/* Win Go */}
          <div
            onClick={() => onSelectGame('wingo')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-wingo.jpg" alt="Win Go" />
          </div>

          {/* K3 */}
          <div
            onClick={() => alert('K3 Lottery simulation coming in next update')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-k3.png" alt="K3" />
          </div>

          {/* 5D */}
          <div
            onClick={() => alert('5D Lottery simulation coming in next update')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-5d.png" alt="5D" />
          </div>
        </div>

        {/* Moto Racing below */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div
            onClick={() => alert('Moto Racing parity game coming soon')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-motoracing.png" alt="Moto Racing" />
          </div>

          <div
            onClick={() => onSelectGame('aviator')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-aviator.png" alt="Aviator" />
          </div>

          <div
            onClick={() => alert('TRX Dice game coming soon')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-trxdice.png" alt="TRX Dice" />
          </div>
        </div>
      </div>

      {/* 3. MINI GAMES SHELF */}
      <div className="l7-section-container">
        <div className="l7-section-header">
          <div className="l7-section-title">
            <Plane className="w-4 h-4 text-purple-500" />
            <span>Mini games</span>
          </div>

          <div className="l7-section-more">
            <span>Detail</span>
            <div className="l7-section-arrows">
              <span className="l7-arrow-btn">
                <ChevronLeft className="w-3 h-3" />
              </span>
              <span className="l7-arrow-btn">
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => onSelectGame('aviator')}
            className="l7-game-card cursor-pointer"
          >
            <img src="/assets/lottery7/game-aviator.png" alt="Aviator" />
          </div>

          <div
            onClick={() => alert('Mines game coming soon')}
            className="l7-game-card bg-slate-100 min-h-[90px] flex items-center justify-center p-2 text-center text-xs text-slate-400 font-bold"
          >
            Mines Crash
          </div>

          <div
            onClick={() => alert('Plinko game coming soon')}
            className="l7-game-card bg-slate-100 min-h-[90px] flex items-center justify-center p-2 text-center text-xs text-slate-400 font-bold"
          >
            Plinko 3D
          </div>
        </div>
      </div>
    </div>
  );
};
