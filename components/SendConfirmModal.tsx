'use client';

import React, { useState } from 'react';
import { X, Send, AlertTriangle, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { Lead } from '@/lib/types';

interface SendConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onConfirmSend: (lead: Lead, idempotencyKey: string) => Promise<void>;
  busy: boolean;
  globalPaused?: boolean;
}

export default function SendConfirmModal({
  isOpen,
  onClose,
  lead,
  onConfirmSend,
  busy,
  globalPaused = false,
}: SendConfirmModalProps) {
  const [explicitChecked, setExplicitChecked] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !lead) return null;

  async function handleSend() {
    if (!lead) return;
    if (!explicitChecked) {
      setError('Please check the confirmation box before sending.');
      return;
    }
    setError('');

    // Generate durable unique idempotency key
    const idempotencyKey = `idempotency_${lead.id}_${Date.now()}`;
    try {
      await onConfirmSend(lead, idempotencyKey);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sending failed');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-150 border border-blue-100">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3659e3] text-white flex items-center justify-center shadow-sm">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#172033]">
                Final Email Send Confirmation
              </h2>
              <p className="text-xs text-slate-500">
                Mandatory human review before Resend dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* GLOBAL PAUSE ALERT */}
        {globalPaused && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Outbound email is currently PAUSED globally in Settings. Unpause in Settings before sending.</span>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BODY - SHOWS EXACT RECIPIENT, SUBJECT, AND MESSAGE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                EXACT RECIPIENT EMAIL
              </span>
              <strong className="text-slate-900 text-sm">{lead.email}</strong>
              <span className="text-slate-500 ml-2">({lead.company_name})</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                EXACT SUBJECT LINE
              </span>
              <div className="text-slate-900 font-semibold mt-0.5">{lead.email_subject}</div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              EXACT EMAIL BODY TO BE TRANSMITTED
            </span>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {lead.email_body}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#3659e3]">
              <ShieldCheck size={16} />
              <span>Safety & Anti-Spam Compliance</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              A secure cryptographic unsubscribe link and <code className="bg-white px-1 py-0.5 rounded text-[10px]">List-Unsubscribe</code> header will be automatically appended. Double submissions are prevented with a durable server idempotency lock.
            </p>
          </div>

          {/* EXPLICIT CONFIRMATION CHECKBOX */}
          <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={explicitChecked}
              onChange={(e) => setExplicitChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#3659e3] border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700 leading-relaxed font-medium">
              I confirm that I have reviewed the exact recipient, subject, and body above and explicitly approve sending this outreach email via Resend.
            </span>
          </label>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !explicitChecked || globalPaused}
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Send size={15} />
            <span>{busy ? 'Transmitting…' : 'Confirm & Send Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
