'use client';

import React from 'react';
import {
  Users,
  UserPlus,
  Mail,
  MessageSquare,
  Clock,
  ShieldAlert,
  FileCheck2,
  CheckCircle,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  Bot,
} from 'lucide-react';
import { DashboardMetrics } from '@/lib/types';

interface DashboardTabProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  dateRange: string;
  onRangeChange: (range: string) => void;
  onRefresh: () => void;
  onAddLead: () => void;
  onOpenAiScout?: () => void;
  onNavigateTab: (tab: any) => void;
}

export default function DashboardTab({
  metrics,
  loading,
  dateRange,
  onRangeChange,
  onRefresh,
  onAddLead,
  onOpenAiScout,
  onNavigateTab,
}: DashboardTabProps) {
  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <RefreshCw className="animate-spin mb-3 text-[#3659e3]" size={28} />
        <p className="text-sm font-medium">Dashboard data load ho raha hai…</p>
      </div>
    );
  }

  const m = metrics || {
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    interestedLeads: 0,
    repliesReceived: 0,
    followupsDue: 0,
    optedOutCount: 0,
    confirmedEnquiries: 0,
    confirmedOrders: 0,
    actualRevenue: 0,
    estimatedOpportunityValue: 0,
    recentActivity: [],
    weeklyActivity: [],
  };

  const maxWeeklyCount = Math.max(...(m.weeklyActivity.map((w) => w.count) || [1]), 1);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#3659e3] uppercase tracking-wider">
            Noida NCR · Commercial Goods Logistics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Business Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time pipeline, customer inquiries, and actual transport earnings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-white border border-[#e7ebf2] p-1 text-xs font-semibold text-slate-600 shadow-sm">
            {[
              { id: 'all', label: 'All Time' },
              { id: '30d', label: '30 Days' },
              { id: '7d', label: '7 Days' },
              { id: 'today', label: 'Today' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => onRangeChange(r.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  dateRange === r.id ? 'bg-[#3659e3] text-white' : 'hover:bg-slate-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            title="Refresh metrics"
            className="p-2.5 bg-white border border-[#e7ebf2] rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {onOpenAiScout && (
            <button
              onClick={onOpenAiScout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Sparkles size={16} />
              <span>Auto-Find (AI)</span>
            </button>
          )}

          <button
            onClick={onAddLead}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>Naya Lead Jodein</span>
          </button>
        </div>
      </div>

      {/* AI AUTONOMOUS SCOUT BANNER */}
      {onOpenAiScout && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 text-blue-300">
              <Bot size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">AI Autonomous Lead Scout</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide uppercase border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-1 max-w-xl">
                Delhi NCR ke factories, auto component units aur packaging godowns khud dhoond kar CRM me save karein, duplicate filter karein, aur Papa ke liye phone call schedule karein.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAiScout}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-extrabold text-xs sm:text-sm text-white shadow-lg transition-all active:scale-[0.98] shrink-0"
          >
            <Sparkles size={18} />
            <span>🤖 Auto-Find Leads Now</span>
          </button>
        </div>
      )}

      {/* REVENUE & ORDERS HIGHLIGHT ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actual Recorded Revenue */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-2">
            <span>Confirmed Transport Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            ₹{m.actualRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {m.confirmedOrders} orders booked & executed
          </div>
          <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
            Asli Kamaai (Recorded actual payments only)
          </div>
        </div>

        {/* Estimated Opportunity Value */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Estimated Pipeline Value</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#3659e3] flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            ₹{m.estimatedOpportunityValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Potential open freight deals
          </div>
          <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
            Estimated value (Distinct from confirmed revenue)
          </div>
        </div>

        {/* Follow-ups Due */}
        <div
          onClick={() => onNavigateTab('followups')}
          className="bg-white border border-[#e7ebf2] hover:border-amber-300 rounded-2xl p-5 shadow-sm cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Follow-ups Due</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            {m.followupsDue}
          </div>
          <div className="text-[11px] text-amber-600 font-bold mt-1">
            Immediate attention needed
          </div>
          <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Party ko call karein</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Confirmed Transport Enquiries */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Quotation Enquiries</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            {m.confirmedEnquiries}
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            Rates requested or active discussions
          </div>
          <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
            Rate quotation stages
          </div>
        </div>
      </div>

      {/* CORE OPERATIONAL METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Leads */}
        <div
          onClick={() => onNavigateTab('leads')}
          className="bg-white border border-[#e7ebf2] p-4 rounded-xl shadow-sm hover:border-[#3659e3] cursor-pointer transition-colors"
        >
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Users size={14} className="text-blue-500" />
            Total Leads
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">{m.totalLeads}</div>
          <div className="text-[10px] text-slate-400 mt-1">Kul parties</div>
        </div>

        {/* New Leads */}
        <div className="bg-white border border-[#e7ebf2] p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <UserPlus size={14} className="text-indigo-500" />
            New
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">{m.newLeads}</div>
          <div className="text-[10px] text-slate-400 mt-1">Bina contact</div>
        </div>

        {/* Contacted */}
        <div className="bg-white border border-[#e7ebf2] p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Mail size={14} className="text-amber-500" />
            Contacted
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
            {m.contactedLeads}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Email bheja gaya</div>
        </div>

        {/* Replies Received */}
        <div className="bg-white border border-[#e7ebf2] p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <MessageSquare size={14} className="text-teal-500" />
            Replies
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
            {m.repliesReceived}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Jawab mila</div>
        </div>

        {/* Interested */}
        <div className="bg-white border border-[#e7ebf2] p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-500" />
            Interested
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
            {m.interestedLeads}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ruchikar parties</div>
        </div>

        {/* Opted Out / Suppressed */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="bg-white border border-[#e7ebf2] p-4 rounded-xl shadow-sm hover:border-red-300 cursor-pointer transition-colors"
        >
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-red-500" />
            Suppressed
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">
            {m.optedOutCount}
          </div>
          <div className="text-[10px] text-red-500 font-medium mt-1">Opted out / Safe</div>
        </div>
      </div>

      {/* CHARTS & RECENT ACTIVITY DUAL COLUMN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WEEKLY ACTIVITY CHART */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#172033]">Weekly Lead Generation</h2>
              <p className="text-xs text-slate-400">Past 7 days volume of researched business leads</p>
            </div>
          </div>

          {m.weeklyActivity.length > 0 && m.totalLeads > 0 ? (
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
              {m.weeklyActivity.map((w, idx) => {
                const heightPercent = Math.max(Math.round((w.count / maxWeeklyCount) * 100), 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-600">{w.count}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] bg-[#3659e3] hover:bg-[#2848c7] rounded-t-lg transition-all"
                      title={`${w.day} (${w.date}): ${w.count} leads`}
                    ></div>
                    <span className="text-[10px] font-medium text-slate-400">{w.day}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Users size={24} className="mb-2 text-slate-300" />
              <span>Chart data will populate as you add new leads.</span>
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY AUDIT FEED */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#172033]">Recent CRM Activity</h2>
              <p className="text-xs text-slate-400">Audit history of outreach, status changes, and follow-ups</p>
            </div>
            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs font-bold text-[#3659e3] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-56">
            {m.recentActivity.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-slate-400 text-xs">
                No recent activity recorded yet.
              </div>
            ) : (
              m.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-[#f8f9fd] border border-[#eef1f8] rounded-xl text-xs flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#172033] truncate">{act.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By {act.actor} ·{' '}
                      {new Date(act.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shrink-0">
                    {act.action.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
