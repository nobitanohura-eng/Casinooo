import React, { useState } from 'react';
import { X, ShieldCheck, Check, Info, HelpCircle, Trophy, User } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';

// 1. How to Play Modal
interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl shadow-2xl p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2b2e]">
          <div className="flex items-center gap-2">
            <img src="/assets/aviator/question-gray.svg" alt="How to play" className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-wide">HOW TO PLAY AVIATOR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#252528] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-[#141516] border border-[#282a2e] flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-black flex items-center justify-center shrink-0 border border-rose-500/40 text-sm">
              1
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">BET BEFORE TAKEOFF</h4>
              <p className="text-slate-400 leading-relaxed">
                Choose your stake amount and click the green <strong className="text-emerald-400">BET</strong> button. You can even place two bets simultaneously for advanced cashout strategies!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141516] border border-[#282a2e] flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 border border-amber-500/40 text-sm">
              2
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">WATCH MULTIPLIER CLIMB</h4>
              <p className="text-slate-400 leading-relaxed">
                As the lucky red aircraft ascends into the sky, the multiplier starts at 1.00x and exponentially increases. The higher the flight, the bigger your win!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141516] border border-[#282a2e] flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 border border-emerald-500/40 text-sm">
              3
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">CASH OUT BEFORE CRASH</h4>
              <p className="text-slate-400 leading-relaxed">
                Hit <strong className="text-amber-400">CASH OUT</strong> before the plane flies away! If you cash out in time, your win is your bet multiplied by the current odds. If the plane flies away first, the bet is lost.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#252528] border border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="font-bold text-white">Return to Player (RTP):</span>
            <span className="font-mono font-bold text-emerald-400">97.00% (Certified RNG)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#2a2b2e]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-transform active:scale-98 shadow-lg"
          >
            I Understood, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Avatar Picker Modal (All 22 authentic Spribe avatars)
interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: string;
  onSelectAvatar: (avatarId: string) => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  currentAvatar,
  onSelectAvatar,
  onClose,
}) => {
  if (!isOpen) return null;

  const avatars = [
    'av-31', 'av-70', 'av-48', 'av-54', 'av-69', 'av-17',
    'av-55', 'av-9',  'av-49', 'av-8',  'av-1',  'av-21',
    'av-15', 'av-24', 'av-40', 'av-25', 'av-72', 'av-42',
    'av-61', 'av-47', 'av-30', 'av-36'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2b2e]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-wide">CHOOSE YOUR AVATAR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#252528] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-xs text-slate-400 mb-3">
            Select an official Aviator pilot avatar to show in the live multiplayer lobby and leaderboards:
          </p>

          <div className="grid grid-cols-5 gap-3 max-h-72 overflow-y-auto p-1">
            {avatars.map((av) => {
              const isSelected = currentAvatar === av;
              return (
                <button
                  key={av}
                  onClick={() => {
                    onSelectAvatar(av);
                    onClose();
                  }}
                  className={`relative p-1 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                      : 'border-transparent hover:border-slate-500'
                  }`}
                >
                  <img
                    src={`/assets/avatars/${av}.png`}
                    alt={av}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#2a2b2e]">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#252528] hover:bg-[#2c2d30] text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Provably Fair Settings Modal
interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2b2e]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-wide">PROVABLY FAIR SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#252528] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs text-slate-300">
          <p className="text-slate-400">
            Aviator uses cryptographic technology called Provably Fair. This guarantees that 100% of game outcomes are fair and that there is no third-party interference in the game process.
          </p>

          <div className="space-y-2 font-mono text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">
                Active Client Seed
              </span>
              <div className="p-2 bg-[#141516] rounded-lg border border-[#282a2e] text-slate-200 select-all">
                c_seed_8f7b2a9e3d1c440a
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">
                Server Seed (Hashed SHA-512)
              </span>
              <div className="p-2 bg-[#141516] rounded-lg border border-[#282a2e] text-slate-200 break-all select-all">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#141516] rounded-xl border border-emerald-500/20 text-emerald-300 text-[11px]">
            The round multiplier is generated from a combination of the server seed and the client seeds of the first 3 players in the round. No one can predict or influence the result.
          </div>
        </div>

        <div className="pt-3 border-t border-[#2a2b2e]">
          <button
            onClick={onClose}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Game Rules Modal
interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2b2e]">
          <h3 className="text-base font-bold text-white tracking-wide">GAME RULES</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#252528] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs text-slate-300">
          <section>
            <h4 className="font-bold text-white mb-1">1. Game Overview</h4>
            <p className="text-slate-400">
              Aviator is a social multiplayer game consisting of an increasing curve that can crash at any time. When the round starts, the multiplier scale starts growing from 1.00x upward.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-white mb-1">2. Payouts and Multipliers</h4>
            <p className="text-slate-400">
              The win amount is calculated as your bet multiplied by the multiplier at which you cashed out. If you did not cash out before the plane flies away, your bet is forfeited.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-white mb-1">3. Game Settings & Auto Features</h4>
            <p className="text-slate-400">
              Auto Bet automatically places bets on consecutive rounds. Auto Cash Out automatically cashes out when the plane reaches your preset target multiplier.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-white mb-1">4. Technical Malfunction</h4>
            <p className="text-slate-400">
              In the event of an internet disconnect after bet placement, the bet is automatically cashed out at the current multiplier if still flying.
            </p>
          </section>
        </div>

        <div className="pt-3 border-t border-[#2a2b2e]">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#252528] hover:bg-[#2c2d30] text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Game Limits Modal
interface GameLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameLimitsModal: React.FC<GameLimitsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2b2e]">
          <h3 className="text-base font-bold text-white tracking-wide">GAME LIMITS</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#252528] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#141516] border border-[#282a2e] flex items-center justify-between">
            <span className="text-slate-400">Minimum Bet</span>
            <span className="font-mono font-bold text-white">₹10.00</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#141516] border border-[#282a2e] flex items-center justify-between">
            <span className="text-slate-400">Maximum Bet</span>
            <span className="font-mono font-bold text-white">₹10,000.00</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#141516] border border-[#282a2e] flex items-center justify-between">
            <span className="text-slate-400">Maximum Win</span>
            <span className="font-mono font-bold text-emerald-400">₹10,00,000.00</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#141516] border border-[#282a2e] flex items-center justify-between">
            <span className="text-slate-400">Minimum Auto Cash Out</span>
            <span className="font-mono font-bold text-white">1.01x</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#141516] border border-[#282a2e] flex items-center justify-between">
            <span className="text-slate-400">Maximum Auto Cash Out</span>
            <span className="font-mono font-bold text-white">100.00x</span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#2a2b2e]">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#252528] hover:bg-[#2c2d30] text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. Member Sign In Modal
interface SignInModalProps {
  isOpen: boolean;
  currentAccountId: string;
  onSelectAccount: (newId: string) => void;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onSelectAccount,
  onClose,
}) => {
  const [mobileOrId, setMobileOrId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileOrId.trim()) {
      onSelectAccount(mobileOrId.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2b2e]">
          <h3 className="text-base font-bold text-white tracking-wide">MEMBER SIGN IN</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#252528] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Registered 10-Digit Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={mobileOrId}
              onChange={(e) => setMobileOrId(e.target.value)}
              className="w-full px-3 py-2 bg-[#141516] border border-[#282a2e] rounded-xl text-white text-xs outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-colors shadow-md"
          >
            Verify & Enter
          </button>
        </form>
      </div>
    </div>
  );
};

