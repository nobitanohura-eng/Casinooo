import React from 'react';
import { Sparkles, Plane } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

export type GameModule = 'wingo' | 'aviator';

interface GameSelectorProps {
  activeGame: GameModule;
  onSelectGame: (game: GameModule) => void;
  winGoStatusText?: string;
  aviatorStatusText?: string;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  activeGame,
  onSelectGame,
  winGoStatusText,
  aviatorStatusText,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full px-3 pt-2 pb-1 bg-[#070b14]">
      {/* Crisp Industrial Segmented Tabs (rounded-lg, micro-borders) */}
      <div className="bg-[#0b101c] p-1 rounded-lg border border-slate-700/60 grid grid-cols-2 gap-1.5 shadow-md">
        {/* Win Go Tab */}
        <button
          onClick={() => {
            soundManager.play('click');
            onSelectGame('wingo');
          }}
          className={`relative flex items-center justify-center gap-2 py-2 px-2.5 rounded-md transition-all duration-150 tap-highlight-none ${
            activeGame === 'wingo'
              ? 'bg-gradient-to-r from-emerald-950/90 to-slate-800 text-white border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center ${
              activeGame === 'wingo' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left flex flex-col min-w-0">
            <span className="font-casino-num font-black text-xs uppercase tracking-wide leading-tight truncate">
              {t('winGo')}
            </span>
            <span className="text-[10px] text-emerald-400 font-casino-num font-bold leading-tight truncate">
              {winGoStatusText || 'Parity • 60s'}
            </span>
          </div>
        </button>

        {/* Aviator Tab */}
        <button
          onClick={() => {
            soundManager.play('click');
            onSelectGame('aviator');
          }}
          className={`relative flex items-center justify-center gap-2 py-2 px-2.5 rounded-md transition-all duration-150 tap-highlight-none ${
            activeGame === 'aviator'
              ? 'bg-gradient-to-r from-rose-950/90 to-slate-800 text-white border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center ${
              activeGame === 'aviator' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Plane className="w-3.5 h-3.5 fill-current rotate-45" />
          </div>
          <div className="text-left flex flex-col min-w-0">
            <span className="font-casino-num font-black text-xs uppercase tracking-wide leading-tight truncate">
              {t('aviator')}
            </span>
            <span className="text-[10px] text-rose-400 font-casino-num font-bold leading-tight truncate">
              {aviatorStatusText || 'Crash • Live'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
