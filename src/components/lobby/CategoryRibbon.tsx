import React, { useState } from 'react';
import { Sparkles, Trophy, Flame, Disc, Gamepad2, Layers } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { GameModule } from '../layout/GameSelector.tsx';

interface CategoryRibbonProps {
  activeGame: GameModule;
  onSelectGame: (game: GameModule) => void;
}

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({
  activeGame,
  onSelectGame,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'lottery' | 'casino' | 'sports' | 'slots'>('lottery');
  const [activeSubFilter, setActiveSubFilter] = useState<'wingo' | '7up7down' | 'matka' | 'aviator'>(
    activeGame === 'aviator' ? 'aviator' : 'wingo'
  );

  const categories = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'lottery', label: 'Lottery', icon: Sparkles, activeBadge: true },
    { id: 'casino', label: 'Casino', icon: Trophy },
    { id: 'sports', label: 'Sports', icon: Flame },
    { id: 'slots', label: 'Slots', icon: Disc },
  ];

  const subFilters = [
    { id: 'wingo', label: 'WinGo 1Min', game: 'wingo' as GameModule },
    { id: '7up7down', label: '7Up 7Down', comingSoon: true },
    { id: 'matka', label: 'Fast Matka', comingSoon: true },
    { id: 'aviator', label: 'Aviator Crash', game: 'aviator' as GameModule },
  ];

  return (
    <div className="space-y-2 px-3 pt-1">
      {/* 1. Main Category Taxonomy Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.play('click');
                setActiveCategory(cat.id as any);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-casino-num font-black transition-all shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 shadow-[0_2px_10px_rgba(245,158,11,0.35)]'
                  : 'bg-[#0e1424] text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="uppercase tracking-wider">{cat.label}</span>
              {cat.activeBadge && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Sub-Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-[11px]">
        {subFilters.map((sub) => {
          const isSelected =
            (sub.game === activeGame) ||
            (sub.id === activeSubFilter && !sub.comingSoon);

          return (
            <button
              key={sub.id}
              onClick={() => {
                soundManager.play('click');
                setActiveSubFilter(sub.id as any);
                if (sub.game) {
                  onSelectGame(sub.game);
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-casino-num font-bold transition-all shrink-0 border flex items-center gap-1 ${
                isSelected
                  ? 'bg-[#1e1338] text-amber-300 border-amber-500/60 shadow-sm'
                  : 'bg-[#090d18] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{sub.label}</span>
              {sub.comingSoon ? (
                <span className="text-[8px] px-1 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 uppercase">
                  SOON
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
