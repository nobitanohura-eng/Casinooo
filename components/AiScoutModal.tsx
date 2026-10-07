'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  MapPin,
  Truck,
  CheckCircle2,
  X,
  Play,
  Loader2,
  ArrowRight,
  TrendingUp,
  FileText,
  PhoneCall,
  Search,
} from 'lucide-react';
import { LEAD_CATEGORIES } from '@/lib/types';

interface AiScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AiScoutModal({ isOpen, onClose, onSuccess }: AiScoutModalProps) {
  const [targetArea, setTargetArea] = useState('All Delhi NCR');
  const [category, setCategory] = useState('all');
  const [count, setCount] = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoDraft, setAutoDraft] = useState(true);
  const [autoFollowup, setAutoFollowup] = useState(true);

  // Execution states
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const steps = [
    '🛰️ Scanning Delhi NCR industrial directories & commercial hubs…',
    '🏭 Analyzing cargo requirements & daily transit demand for Tata Ace Gold…',
    '🔍 Checking deduplication against existing database phone & email records…',
    '✍️ Crafting personalized English/Hinglish outreach drafts & trip rates…',
    '📅 Scheduling click-to-call follow-ups for Papa with phone links…',
  ];

  async function handleStartScouting() {
    setRunning(true);
    setError('');
    setResult(null);
    setCurrentStep(0);

    // Simulate animated step progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch('/api/agent/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_area: targetArea,
          category: category === 'all' ? undefined : category,
          count,
          custom_prompt: customPrompt.trim() || undefined,
          auto_draft: autoDraft,
          auto_followup: autoFollowup,
        }),
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to auto-generate leads');
      }

      setCurrentStep(steps.length);
      setResult(data);
      onSuccess();
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err?.message || 'Error running AI Scout');
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError('');
    setCurrentStep(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">AI Lead Scout</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase">
                  Autonomous
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Auto-discovers real B2B leads needing Tata Ace logistics in Delhi NCR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Running State */}
          {running && (
            <div className="py-8 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">Scout Agent in Action</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Searching Delhi NCR industrial clusters for genuine transport opportunities…
                </p>
              </div>

              {/* Steps Progress */}
              <div className="max-w-md mx-auto text-left space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                {steps.map((text, idx) => {
                  const isDone = currentStep > idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 transition-all ${
                        isDone
                          ? 'text-emerald-700 font-medium'
                          : isCurrent
                          ? 'text-blue-700 font-bold scale-[1.01]'
                          : 'text-slate-400 opacity-60'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="text-blue-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                      )}
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result View */}
          {!running && result && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <span>Auto-Discovery Complete!</span>
                  </div>
                  <span className="text-xs font-bold bg-emerald-200/60 px-2 py-0.5 rounded-lg text-emerald-800">
                    +{result.count} New Leads
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {result.message} Potential pipeline value generated:{' '}
                  <strong>₹{Number(result.total_pipeline_value || 0).toLocaleString('en-IN')}</strong>.
                </p>
              </div>

              {/* Generated Leads List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Discovered Companies
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {result.leads?.map((lead: any) => (
                    <div
                      key={lead.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-sm flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <b className="font-extrabold text-slate-900 block text-sm">
                          {lead.company_name}
                        </b>
                        <div className="text-slate-500 mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                          <span>👤 {lead.contact_name}</span>
                          <span>•</span>
                          <span>📍 {lead.city}</span>
                          <span>•</span>
                          <span>🚚 {lead.route_area}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-blue-600 block text-xs">
                          ₹{Number(lead.estimated_value || 0).toLocaleString('en-IN')}/mo
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {lead.priority} priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Scout Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#3659e3] hover:bg-[#2848c7] rounded-xl text-xs font-extrabold text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>View in CRM</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Form Configuration View */}
          {!running && !result && (
            <div className="space-y-4 text-xs">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-blue-900 leading-relaxed text-[11px]">
                  <strong>1-Click AI Lead Generation:</strong> The agent searches industrial estates across
                  Delhi NCR, verifies non-duplicate contacts, crafts initial outreach pitches for Tata Ace,
                  and sets click-to-call follow-ups for Papa automatically.
                </div>
              </div>

              {/* Target Region */}
              <label className="block font-bold text-slate-700">
                Target Region / Hub
                <div className="relative mt-1">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="All Delhi NCR">All Delhi NCR (Noida, Greater Noida, Delhi, Ghaziabad)</option>
                    <option value="Noida">Noida (Sector 62, 63, 65, 80, 83 Industrial)</option>
                    <option value="Greater Noida">Greater Noida (Kasna, Surajpur, Ecotech III)</option>
                    <option value="Delhi">Delhi (Okhla Phase 1/2/3, Patparganj, Mayapuri)</option>
                    <option value="Ghaziabad">Ghaziabad (Sahibabad Site 4, Loni Road)</option>
                    <option value="Gurgaon">Gurgaon (Udyog Vihar, Manesar)</option>
                  </select>
                </div>
              </label>

              {/* Target Category */}
              <label className="block font-bold text-slate-700">
                Industry Sector
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="all">All Sectors (Mix of Garments, Auto, Packaging, Pharma)</option>
                  {LEAD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              {/* Quantity */}
              <div>
                <span className="block font-bold text-slate-700 mb-1.5">Number of Leads to Find</span>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        count === num
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {num} Leads
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt (Optional) */}
              <label className="block font-bold text-slate-700">
                Custom Focus / Prompt (Optional)
                <div className="relative mt-1">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Find medical surgical suppliers in Patparganj needing covered vehicle"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl font-normal outline-none focus:border-blue-500"
                  />
                </div>
              </label>

              {/* Autonomous features toggles */}
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoDraft}
                    onChange={(e) => setAutoDraft(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <FileText size={15} className="text-slate-400" />
                  <span>Auto-draft personalized Hinglish outreach email for human review</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoFollowup}
                    onChange={(e) => setAutoFollowup(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <PhoneCall size={15} className="text-slate-400" />
                  <span>Auto-schedule click-to-call phone follow-up reminder for Papa</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleStartScouting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-extrabold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Sparkles size={18} />
                  <span>Start AI Lead Scout ({count} Leads)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
