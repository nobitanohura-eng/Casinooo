'use client';

import React, { useState } from 'react';
import {
  CalendarClock,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MessageSquare,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { FollowUp, Lead } from '@/lib/types';

interface FollowupsTabProps {
  followups: {
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
    counts: { overdue: number; today: number; upcoming: number; completed: number };
  };
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
  onComplete: (id: string, outcome: string) => Promise<void>;
  onReschedule: (id: string, newDate: string) => Promise<void>;
  onSelectLead: (lead: Lead) => void;
  busy: boolean;
}

export default function FollowupsTab({
  followups,
  leads,
  loading,
  onRefresh,
  onComplete,
  onReschedule,
  onSelectLead,
  busy,
}: FollowupsTabProps) {
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming' | 'completed'>('today');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [outcomeNote, setOutcomeNote] = useState('');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const currentList = followups[activeTab] || [];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#3659e3] uppercase tracking-wider">
            Lead Relationship Tracker
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Follow-up Reminders (Yaad Rakhein)
          </h1>
          <p className="text-xs text-slate-500">
            Never miss a call or transport quote with factory owners and dispatch managers.
          </p>
        </div>
      </div>

      {/* TAB SELECTOR WITH BADGES */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'bg-amber-100 text-amber-900 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock size={15} className="text-amber-600" />
          <span>Overdue (Baaki)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-800 text-[10px]">
            {followups.counts.overdue}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'today'
              ? 'bg-[#3659e3] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarClock size={15} />
          <span>Today (Aaj Karna Hai)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'today' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {followups.counts.today}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={15} />
          <span>Upcoming (Aane Wale Din)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'upcoming' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {followups.counts.upcoming}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-emerald-100 text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span>Completed (Khatam)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px]">
            {followups.counts.completed}
          </span>
        </button>
      </div>

      {/* FOLLOW-UPS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading follow-ups…</div>
        ) : currentList.length === 0 ? (
          <div className="p-12 bg-white border border-[#e7ebf2] rounded-2xl text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <div className="font-bold text-sm text-[#172033]">No pending follow-ups here</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All party reminders for this category are up to date. You can schedule new ones from any lead.
            </p>
          </div>
        ) : (
          currentList.map((f) => {
            const lead = leads.find((l) => l.id === f.lead_id) || f.lead;
            const isCompleting = completingId === f.id;
            const isRescheduling = reschedulingId === f.id;

            return (
              <div
                key={f.id}
                className="bg-white border border-[#e7ebf2] hover:border-blue-200 rounded-2xl p-4 sm:p-5 shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[#172033]">
                        {lead?.company_name || 'Party Contact'}
                      </span>
                      {lead?.city && (
                        <span className="text-xs text-slate-400">· {lead.city}</span>
                      )}
                    </div>
                    {lead?.contact_name && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Contact Person: <strong className="text-slate-700">{lead.contact_name}</strong>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <Clock size={14} className="text-[#3659e3]" />
                    <span>
                      Scheduled:{' '}
                      {new Date(f.scheduled_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* NOTES / REMINDER REASON */}
                {f.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed">
                    <strong>Note:</strong> {f.notes}
                  </div>
                )}

                {/* OUTCOME IF COMPLETED */}
                {f.status === 'completed' && f.outcome && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800">
                    <strong>Outcome:</strong> {f.outcome}
                  </div>
                )}

                {/* ACTION ROW (CALL NOW, COMPLETE, RESCHEDULE) */}
                {f.status !== 'completed' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {lead?.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors touch-manipulation"
                        >
                          <Phone size={14} />
                          <span>Call: {lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No phone</span>
                      )}

                      {lead && (
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead as Lead)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          View Lead
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReschedulingId(isRescheduling ? null : f.id);
                          setCompletingId(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Reschedule
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCompletingId(isCompleting ? null : f.id);
                          setReschedulingId(null);
                        }}
                        className="px-3.5 py-2 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                )}

                {/* INLINE COMPLETE FORM */}
                {isCompleting && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-[#172033]">
                      Follow-up Outcome (Kya baat hui?)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Party interested, rate quote mangwaya, next week gaddi load karega"
                      value={outcomeNote}
                      onChange={(e) => setOutcomeNote(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setCompletingId(null)}
                        className="text-xs text-slate-500 font-semibold px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          await onComplete(f.id, outcomeNote);
                          setCompletingId(null);
                          setOutcomeNote('');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Save & Mark Complete
                      </button>
                    </div>
                  </div>
                )}

                {/* INLINE RESCHEDULE FORM */}
                {isRescheduling && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700">
                      New Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setReschedulingId(null)}
                        className="text-xs text-slate-500 font-semibold px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={busy || !rescheduleDate}
                        onClick={async () => {
                          await onReschedule(f.id, new Date(`${rescheduleDate}T10:00:00`).toISOString());
                          setReschedulingId(null);
                          setRescheduleDate('');
                        }}
                        className="px-3 py-1.5 bg-[#3659e3] text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Confirm New Date
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
