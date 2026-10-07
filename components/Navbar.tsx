'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Mail,
  CalendarClock,
  Activity,
  Settings,
  Truck,
  LogOut,
} from 'lucide-react';

export type TabType = 'dashboard' | 'leads' | 'campaigns' | 'followups' | 'activity' | 'settings';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userEmail: string;
  onLogout: () => void;
  leadsCount: number;
  followupsDueCount: number;
}

export default function Navbar({
  currentTab,
  onSelectTab,
  userEmail,
  onLogout,
  leadsCount,
  followupsDueCount,
}: NavbarProps) {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      hindi: 'Mukhya Page',
      icon: LayoutDashboard,
    },
    {
      id: 'leads' as TabType,
      label: 'Leads',
      hindi: 'Party List',
      icon: Users,
      badge: leadsCount > 0 ? leadsCount : undefined,
    },
    {
      id: 'campaigns' as TabType,
      label: 'Campaigns',
      hindi: 'Email Bhejein',
      icon: Mail,
    },
    {
      id: 'followups' as TabType,
      label: 'Follow-ups',
      hindi: 'Yaad Rakhein',
      icon: CalendarClock,
      badge: followupsDueCount > 0 ? followupsDueCount : undefined,
      badgeAlert: followupsDueCount > 0,
    },
    {
      id: 'activity' as TabType,
      label: 'Activity',
      hindi: 'Karyavahi',
      icon: Activity,
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      hindi: 'Seva Niyam',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e7ebf2] flex-col z-20">
        <div className="p-6 border-b border-[#f0f3f8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3659e3] flex items-center justify-center font-bold shadow-sm">
              <Truck size={22} />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-[#172033]">
                Papa Transport
              </div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Delhi NCR Logistics
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          Workspace Navigation
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                  isActive
                    ? 'bg-[#edf1ff] text-[#3659e3] shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#3659e3]' : 'text-slate-400'} />
                <div className="flex-1 min-w-0">
                  <div className="leading-snug">{item.label}</div>
                  <div className="text-[10px] font-normal text-slate-400">{item.hindi}</div>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeAlert
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-white border border-[#e1e6ff] text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Transport business footer note */}
        <div className="p-4 mx-3 mb-3 bg-[#f8f9fd] border border-[#eef1f8] rounded-xl text-xs">
          <div className="font-bold text-[#172033] mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Tata Ace Gold Ready
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Noida–Okhla–Delhi NCR goods movement. Only send emails you review & approve.
          </div>
        </div>

        {/* User bar */}
        <div className="p-4 border-t border-[#e7ebf2] flex items-center gap-3 bg-white">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
            {(userEmail[0] || 'P').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#172033] truncate">{userEmail || 'Owner'}</div>
            <div className="text-[10px] text-slate-400">Authenticated</div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-[#e7ebf2] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3659e3] flex items-center justify-center">
            <Truck size={18} />
          </div>
          <span className="font-extrabold text-sm text-[#172033]">Papa Transport</span>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 p-1"
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Android-friendly large touch targets) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#e7ebf2] flex items-center justify-around h-16 z-20 px-1 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative min-h-[48px] touch-manipulation transition-colors ${
                isActive ? 'text-[#3659e3]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'text-[#3659e3]' : 'text-slate-500'} />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold leading-tight ${
                      item.badgeAlert ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
