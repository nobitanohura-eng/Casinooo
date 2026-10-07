import React, { useState, useEffect, useRef } from 'react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';
import { HelpCircle, Plus } from 'lucide-react';

interface SpribeHeaderProps {
  balance: number;
  accountId: string;
  avatarId: string;
  onOpenDeposit: () => void;
  onOpenAvatarPicker: () => void;
  onOpenHowToPlay: () => void;
  onOpenProvablyFair: () => void;
  onOpenGameRules: () => void;
  onOpenBetHistory: () => void;
  onOpenGameLimits: () => void;
  onOpenFreeBets: () => void;
  onOpenLoginModal?: () => void;
}

export const SpribeHeader: React.FC<SpribeHeaderProps> = ({
  balance,
  accountId,
  avatarId,
  onOpenDeposit,
  onOpenAvatarPicker,
  onOpenHowToPlay,
  onOpenProvablyFair,
  onOpenGameRules,
  onOpenBetHistory,
  onOpenGameLimits,
  onOpenFreeBets,
  onOpenLoginModal,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return soundManager.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const toggleSound = () => {
    soundManager.toggle();
  };

  const toggleMusic = () => {
    setMusicEnabled((prev) => !prev);
  };

  const toggleAnimation = () => {
    setAnimationEnabled((prev) => !prev);
  };

  const avatarSrc = `/assets/avatars/${avatarId}.png`;

  return (
    <header className="spribe-header">
      {/* Left: Brand Identity & How to Play */}
      <div className="spribe-header-left">
        <div className="spribe-game-logo" onClick={onOpenHowToPlay} title="Apex Aviator">
          <img src="/assets/aviator/aviator-logo.svg" alt="Aviator" />
          <span className="ml-1.5 text-[9px] font-black text-rose-500 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/30 uppercase tracking-wider">
            APEX
          </span>
        </div>

        <button
          onClick={onOpenHowToPlay}
          className="spribe-how-to-play-btn hidden sm:flex"
          title="How to play"
        >
          <span className="icon-q">?</span>
          <span>How to play</span>
        </button>
      </div>

      {/* Right: Balance, Deposit, Burger Menu */}
      <div className="spribe-header-right">
        {/* Balance Display */}
        <div className="spribe-balance-display" onClick={onOpenDeposit} title="Click to deposit">
          <span className="spribe-balance-amount">{balance.toFixed(2)}</span>
          <span className="spribe-balance-currency">INR</span>
        </div>

        {/* Deposit Button */}
        <button onClick={onOpenDeposit} className="spribe-deposit-btn flex items-center gap-1">
          <Plus className="w-3 h-3 stroke-[3]" />
          <span>DEPOSIT</span>
        </button>

        {/* Burger Button & Settings Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="spribe-burger-btn"
            aria-label="Settings Menu"
          >
            <img src="/assets/aviator/burger.svg" alt="Menu" />
          </button>

          {isMenuOpen && (
            <div className="spribe-dropdown-menu">
              {/* User Block */}
              <div className="spribe-user-info-block">
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="spribe-user-avatar-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAvatarPicker();
                  }}
                  onError={(e) => {
                    // Fallback to av-31 if error
                    (e.target as HTMLImageElement).src = '/assets/avatars/av-31.png';
                  }}
                />
                <div className="spribe-user-meta">
                  <div className="spribe-user-id">{accountId}</div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAvatarPicker();
                    }}
                    className="spribe-change-avatar-btn"
                  >
                    Change Avatar
                  </button>
                </div>
              </div>

              {/* Toggles: Sound, Music, Animation */}
              <div className="spribe-menu-section">
                <div className="spribe-menu-toggle-item">
                  <div className="spribe-toggle-left">
                    <img src="/assets/aviator/sound.svg" alt="Sound" className="w-4 h-4" />
                    <span>Sound</span>
                  </div>
                  <div
                    className={`spribe-switch ${soundEnabled ? 'active' : ''}`}
                    onClick={toggleSound}
                  >
                    <div className="spribe-switch-thumb" />
                  </div>
                </div>

                <div className="spribe-menu-toggle-item">
                  <div className="spribe-toggle-left">
                    <img src="/assets/aviator/music.svg" alt="Music" className="w-4 h-4" />
                    <span>Music</span>
                  </div>
                  <div
                    className={`spribe-switch ${musicEnabled ? 'active' : ''}`}
                    onClick={toggleMusic}
                  >
                    <div className="spribe-switch-thumb" />
                  </div>
                </div>

                <div className="spribe-menu-toggle-item">
                  <div className="spribe-toggle-left">
                    <img src="/assets/aviator/animation.svg" alt="Animation" className="w-4 h-4" />
                    <span>Animation</span>
                  </div>
                  <div
                    className={`spribe-switch ${animationEnabled ? 'active' : ''}`}
                    onClick={toggleAnimation}
                  >
                    <div className="spribe-switch-thumb" />
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="spribe-menu-section">
                <button
                  className="spribe-menu-link-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenFreeBets();
                  }}
                >
                  <img src="/assets/aviator/star-menu.svg" alt="Free bets" />
                  <span>Free bets</span>
                </button>

                <button
                  className="spribe-menu-link-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenBetHistory();
                  }}
                >
                  <img src="/assets/aviator/history-grey.svg" alt="My bet history" />
                  <span>My bet history</span>
                </button>

                <button
                  className="spribe-menu-link-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenGameLimits();
                  }}
                >
                  <img src="/assets/aviator/limits.svg" alt="Game limits" />
                  <span>Game limits</span>
                </button>

                <button
                  className="spribe-menu-link-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenHowToPlay();
                  }}
                >
                  <img src="/assets/aviator/question-gray.svg" alt="How to play" />
                  <span>How to play</span>
                </button>

                <button
                  className="spribe-menu-link-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenGameRules();
                  }}
                >
                  <img src="/assets/aviator/rules.svg" alt="Game rules" />
                  <span>Game rules</span>
                </button>

                <button
                  className="spribe-menu-link-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProvablyFair();
                  }}
                >
                  <img src="/assets/aviator/pf-icon.svg" alt="Provably Fair" />
                  <span>Provably Fair settings</span>
                </button>

                {onOpenLoginModal && (
                  <button
                    className="spribe-menu-link-item text-amber-400 font-bold border-t border-slate-800 pt-2 mt-1"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenLoginModal();
                    }}
                  >
                    <span>Switch Account / Sign In</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
