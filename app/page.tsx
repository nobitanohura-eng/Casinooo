'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar, { TabType } from '@/components/Navbar';
import DashboardTab from '@/components/DashboardTab';
import LeadsTab from '@/components/LeadsTab';
import CampaignsTab from '@/components/CampaignsTab';
import FollowupsTab from '@/components/FollowupsTab';
import ActivityTab from '@/components/ActivityTab';
import SettingsTab from '@/components/SettingsTab';
import LeadModal from '@/components/LeadModal';
import LeadDetailModal from '@/components/LeadDetailModal';
import CsvImportModal from '@/components/CsvImportModal';
import SendConfirmModal from '@/components/SendConfirmModal';
import { Lead, DashboardMetrics, EmailDraft, FollowUp, ActivityLog, AppSettings } from '@/lib/types';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [userEmail, setUserEmail] = useState('');

  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [followups, setFollowups] = useState<{
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
    counts: { overdue: number; today: number; upcoming: number; completed: number };
  }>({
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
    counts: { overdue: 0, today: 0, upcoming: 0, completed: 0 },
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [suppressionsCount, setSuppressionsCount] = useState(0);
  const [resendInfo, setResendInfo] = useState({ configured: false, fromEmail: '' });
  const [smsInfo, setSmsInfo] = useState({ enabled: false, reason: '', futureBoundary: '' });

  // Filter states for Leads tab
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dashboardRange, setDashboardRange] = useState('all');

  // UI / Modal states
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sendModalLead, setSendModalLead] = useState<Lead | null>(null);

  // Common API helper
  async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  }

  // Loaders
  const loadLeads = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (statusFilter !== 'all') q.set('status', statusFilter);
      if (categoryFilter !== 'all') q.set('category', categoryFilter);
      if (priorityFilter !== 'all') q.set('priority', priorityFilter);

      const data = await apiFetch(`/api/leads?${q.toString()}`);
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    }
  }, [search, statusFilter, categoryFilter, priorityFilter]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/dashboard?range=${dashboardRange}`);
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, [dashboardRange]);

  const loadDrafts = useCallback(async () => {
    try {
      const data = await apiFetch('/api/campaigns');
      setDrafts(data.drafts || []);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  }, []);

  const loadFollowups = useCallback(async () => {
    try {
      const data = await apiFetch('/api/followups');
      setFollowups({
        overdue: data.overdue || [],
        today: data.today || [],
        upcoming: data.upcoming || [],
        completed: data.completed || [],
        counts: data.counts || { overdue: 0, today: 0, upcoming: 0, completed: 0 },
      });
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      const data = await apiFetch('/api/activity');
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiFetch('/api/settings');
      setSettings(data.settings || null);
      setSuppressions(data.suppressions || []);
      setSuppressionsCount(data.suppressionsCount || 0);
      setResendInfo(data.resend || { configured: false, fromEmail: '' });
      setSmsInfo(data.sms || { enabled: false, reason: '', futureBoundary: '' });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        loadLeads(),
        loadDashboard(),
        loadDrafts(),
        loadFollowups(),
        loadActivities(),
        loadSettings(),
      ]);
    } catch (e) {
      setError('Could not refresh workspace data');
    } finally {
      setLoading(false);
    }
  }, [loadLeads, loadDashboard, loadDrafts, loadFollowups, loadActivities, loadSettings]);

  useEffect(() => {
    refreshAll();
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUserEmail(data.user?.email || 'owner@papatransport.com'))
      .catch(() => {});
  }, [refreshAll]);

  // Lead CRUD Actions
  async function handleSaveLead(leadData: any) {
    setBusy(true);
    setError('');
    try {
      if (editingLead) {
        await apiFetch(`/api/leads/${editingLead.id}`, {
          method: 'PATCH',
          body: JSON.stringify(leadData),
        });
        setNotice('Lead details updated successfully.');
      } else {
        await apiFetch('/api/leads', {
          method: 'POST',
          body: JSON.stringify(leadData),
        });
        setNotice('New business lead added successfully.');
      }
      setEditingLead(null);
      await refreshAll();
    } catch (err) {
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLead(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/leads/${id}`, { method: 'DELETE' });
      setNotice('Lead deleted.');
      setSelectedLead(null);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  // Generate Draft Action
  async function handleGenerateDraft(lead: Lead) {
    setBusy(true);
    setError('');
    try {
      const data = await apiFetch(`/api/leads/${lead.id}/draft`, { method: 'POST' });
      setNotice(`Email draft generated for ${lead.company_name}.`);
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(data.lead);
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft generation failed');
    } finally {
      setBusy(false);
    }
  }

  // Approve Draft Action
  async function handleApproveDraft(leadOrDraftId: any, subject: string, body: string) {
    setBusy(true);
    setError('');
    try {
      if (typeof leadOrDraftId === 'object' && leadOrDraftId.id) {
        const data = await apiFetch(`/api/leads/${leadOrDraftId.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ action: 'approve', subject, body }),
        });
        setNotice(`Draft explicitly approved for ${leadOrDraftId.company_name}.`);
        if (selectedLead) setSelectedLead(data.lead);
      } else {
        await apiFetch(`/api/campaigns/${leadOrDraftId}/approve`, {
          method: 'POST',
          body: JSON.stringify({ subject, body }),
        });
        setNotice('Draft explicitly approved.');
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setBusy(false);
    }
  }

  // Send Email Action (Explicit confirmation passed from modal)
  async function handleSendEmail(lead: Lead, idempotencyKey: string) {
    setBusy(true);
    setError('');
    try {
      const data = await apiFetch(`/api/leads/${lead.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ confirm: true, idempotency_key: idempotencyKey }),
      });
      setNotice(`Email successfully accepted by Resend! (Message ID: ${data.resendId})`);
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(data.lead);
      }
      await refreshAll();
    } catch (err) {
      throw err;
    } finally {
      setBusy(false);
    }
  }

  // Update Status / Follow-up / Revenue
  async function handleUpdateStatus(
    lead: Lead,
    status: string,
    followUpDate?: string,
    revenue?: number
  ) {
    setBusy(true);
    setError('');
    try {
      const data = await apiFetch(`/api/leads/${lead.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          action: status,
          next_follow_up_date: followUpDate,
          actual_revenue: revenue,
        }),
      });
      setNotice(`Status updated to "${status}".`);
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(data.lead);
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setBusy(false);
    }
  }

  // Suppress Lead
  async function handleSuppressLead(lead: Lead) {
    if (!confirm(`Permanently suppress ${lead.company_name}? This prevents all future outreach.`)) {
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch(`/api/leads/${lead.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ action: 'optout' }),
      });
      setNotice(`${lead.company_name} suppressed from all outreach.`);
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(data.lead);
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression failed');
    } finally {
      setBusy(false);
    }
  }

  // Bulk Administrative Actions
  async function handleBulkAction(action: string, leadIds: string[], status?: string) {
    setBusy(true);
    try {
      await apiFetch('/api/leads/bulk', {
        method: 'POST',
        body: JSON.stringify({ action, leadIds, status }),
      });
      setNotice(`Bulk action "${action}" completed.`);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBusy(false);
    }
  }

  // Follow-up completion & rescheduling
  async function handleCompleteFollowup(id: string, outcome: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/followups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed', outcome }),
      });
      setNotice('Follow-up marked completed.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Follow-up update failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleRescheduleFollowup(id: string, newDate: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/followups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ scheduled_at: newDate, status: 'pending' }),
      });
      setNotice('Follow-up rescheduled.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule failed');
    } finally {
      setBusy(false);
    }
  }

  // Settings Updates
  async function handleUpdateSettings(newSettings: Partial<AppSettings>) {
    setBusy(true);
    try {
      await apiFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(newSettings),
      });
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddManualSuppression(email: string) {
    setBusy(true);
    try {
      await apiFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ suppressEmail: email }),
      });
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033] flex flex-col md:flex-row font-sans">
      {/* NAVIGATION */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userEmail={userEmail}
        onLogout={handleLogout}
        leadsCount={leads.length}
        followupsDueCount={followups.counts.overdue + followups.counts.today}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-18 md:pt-8 max-w-7xl w-full mx-auto">
        {/* NOTIFICATIONS */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs">
            <span>{error}</span>
            <button onClick={() => setError('')} className="p-1 hover:text-red-900 font-bold">
              ✕
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="p-1 hover:text-emerald-900 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* ACTIVE TAB CONTENT */}
        {currentTab === 'dashboard' && (
          <DashboardTab
            metrics={metrics}
            loading={loading}
            dateRange={dashboardRange}
            onRangeChange={setDashboardRange}
            onRefresh={refreshAll}
            onAddLead={() => {
              setEditingLead(null);
              setIsAddModalOpen(true);
            }}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'leads' && (
          <LeadsTab
            leads={leads}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            onSelectLead={setSelectedLead}
            onOpenAddModal={() => {
              setEditingLead(null);
              setIsAddModalOpen(true);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onExportCsv={() => {
              window.open(
                `/api/leads/export?status=${statusFilter}&category=${categoryFilter}`,
                '_blank'
              );
            }}
            onBulkAction={handleBulkAction}
            busy={busy}
          />
        )}

        {currentTab === 'campaigns' && (
          <CampaignsTab
            drafts={drafts}
            leads={leads}
            loading={loading}
            onRefresh={refreshAll}
            onSelectLeadForDraft={(lead) => {
              setSelectedLead(lead);
            }}
            onApproveDraft={handleApproveDraft}
            onOpenSendModal={(lead) => setSendModalLead(lead)}
            globalPaused={settings?.global_email_paused ?? true}
            dailySentCount={metrics?.recentActivity.filter((a) => a.action === 'email_sent').length || 0}
            dailyLimit={settings?.daily_send_limit || 25}
            busy={busy}
          />
        )}

        {currentTab === 'followups' && (
          <FollowupsTab
            followups={followups}
            leads={leads}
            loading={loading}
            onRefresh={refreshAll}
            onComplete={handleCompleteFollowup}
            onReschedule={handleRescheduleFollowup}
            onSelectLead={(lead) => setSelectedLead(lead)}
            busy={busy}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityTab activities={activities} loading={loading} onRefresh={refreshAll} />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            settings={settings}
            suppressions={suppressions}
            suppressionsCount={suppressionsCount}
            resendInfo={resendInfo}
            smsInfo={smsInfo}
            loading={loading}
            onRefresh={refreshAll}
            onUpdateSettings={handleUpdateSettings}
            onAddManualSuppression={handleAddManualSuppression}
            busy={busy}
          />
        )}
      </main>

      {/* MODALS */}
      <LeadModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
        initialData={editingLead}
        busy={busy}
      />

      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onEdit={(lead) => {
          setSelectedLead(null);
          setEditingLead(lead);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteLead}
        onGenerateDraft={handleGenerateDraft}
        onApproveDraft={handleApproveDraft}
        onSendEmail={(lead) => {
          setSelectedLead(null);
          setSendModalLead(lead);
        }}
        onUpdateStatus={handleUpdateStatus}
        onSuppress={handleSuppressLead}
        busy={busy}
      />

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => refreshAll()}
      />

      <SendConfirmModal
        isOpen={Boolean(sendModalLead)}
        onClose={() => setSendModalLead(null)}
        lead={sendModalLead}
        onConfirmSend={handleSendEmail}
        busy={busy}
        globalPaused={settings?.global_email_paused}
      />
    </div>
  );
}
