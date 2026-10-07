import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle, Share, Smartphone, Gift } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface AddToDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (amount: number) => void;
}

export const AddToDesktopModal: React.FC<AddToDesktopModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [added, setAdded] = useState(false);

  if (!isOpen) return null;

  const handleAdd = () => {
    soundManager.play('win');
    setAdded(true);
    if (onRewardClaimed) onRewardClaimed(25);
    setTimeout(() => {
      onClose();
      setAdded(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0c101d] border border-amber-500/30 p-5 shadow-2xl text-slate-100 overflow-hidden text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.play('click');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xl mb-3">
          <Smartphone className="w-7 h-7" />
        </div>

        <h3 className="text-base font-black text-white font-casino-num">
          Add Apex Arcade to Home Screen
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Access your games instantly without typing the URL. Faster loading and full-screen gaming experience!
        </p>

        {/* Instructions */}
        <div className="my-4 p-3 rounded-xl bg-[#121829] border border-slate-800 text-left text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Tap the browser menu (<strong>⋮</strong> or <Share className="w-3 h-3 inline text-sky-400" /> Share icon).
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Launch directly from your mobile desktop anytime!
            </p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={added}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {added ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Added! ₹25 Bonus Credited</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>I've Added It (Claim ₹25 Bonus)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
