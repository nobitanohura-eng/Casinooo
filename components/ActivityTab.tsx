'use client';

import React, { useState } from 'react';
import {
  Activity,
  UserPlus,
  Mail,
  CheckCircle2,
  Phone,
  Clock,
  ShieldAlert,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { ActivityLog } from '@/lib/types';

interface ActivityTabProps {
  activities: ActivityLog[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ActivityTab({ activities, loading, onRefresh }: ActivityTabProps) {
  const [filterAction, setFilterAction] = useState('all');

  const filtered = activities.filter((a) => {
    if (filterAction === 'all') return true;
    return a.action.includes(filterAction);
  });

  function getActionIcon(action: string) {
    if (action.includes('lead_created') || action.includes('imported')) {
      return <UserPlus size={16} className="text-blue-600" />;
    }
    if (action.includes('email_sent') || action.includes('delivered')) {
      return <Mail size={16} className="text-emerald-600" />;
    }
    if (action.includes('draft_approved') || action.includes('completed')) {
      return <CheckCircle2 size={16} className="text-teal-600" />;
    }
    if (action.includes('unsubscribed') || action.includes('suppress') || action.includes('bounce')) {
      return <ShieldAlert size={16} className="text-red-600" />;
    }
    if (action.includes('followup')) {
      return <Clock size={16} className="text-amber-600" />;
    }
    return <Activity size={16} className="text-slate-500" />;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#3659e3] uppercase tracking-wider">
            Audit Trail
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            System & User Activity Log
          </h1>
          <p className="text-xs text-slate-500">
            Chronological record of lead research, outreach approval, emails, and follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
          >
            <option value="all">All Actions (Sabhi Karyavahi)</option>
            <option value="lead">Leads Only</option>
            <option value="email">Emails Sent</option>
            <option value="approved">Approvals</option>
            <option value="followup">Follow-ups</option>
            <option value="unsubscribed">Opt-outs / Suppressions</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2.5 bg-white border border-[#e7ebf2] rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh log"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div className="bg-white border border-[#e7ebf2] rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading activity logs…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No activity logs recorded yet.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 my-2">
            {filtered.map((item) => (
              <div key={item.id} className="relative pl-6">
                {/* TIMELINE DOT */}
                <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                  {getActionIcon(item.action)}
                </div>

                <div className="bg-[#f8f9fd] border border-[#eef1f8] rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#172033]">{item.description}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                    <span>Actor: {item.actor}</span>
                    <span>·</span>
                    <span className="uppercase tracking-wider">{item.action.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
