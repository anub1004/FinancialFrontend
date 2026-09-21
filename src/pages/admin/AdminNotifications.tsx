import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Send,
  Users,
  CreditCard,
  Zap,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Eye,
  RefreshCw,
  Play,
  Sliders,
  Server,
  X,
  Radio,
  BarChart2,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminNavbar from './AdminNavbar';
import { ApiConfig, NotificationAdminApiConfig } from '../../config/apiconfig';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType = 'announcement' | 'update' | 'alert' | 'maintenance' | 'offer';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
export type ChannelKey = 'in-app' | 'email' | 'push';
export type LogStatus = 'Sent' | 'Delivered' | 'Queued' | 'Failed';

export interface AutomatedRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditionDescription: string;
  targetTier: string;
  timingOffset: string;
  channels: ChannelKey[];
  titleTemplate: string;
  messageTemplate: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  totalTriggered: number;
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: PriorityLevel;
  targetAudience: string;
  channels: ChannelKey[];
  sentAt: string;
  status: LogStatus;
  recipientCount: number;
  openRate?: string;
  actionUrl?: string;
}

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
  color?: string;
}

interface BroadcastHistoryItem {
  id?: string;
  title: string;
  message: string;
  recipientsCount: number;
  createdAt: string;
  status?: string;
}

interface TierStat {
  slug: string;
  name: string;
  memberCount: number;
  color: string;
}

// ─── Constants (non-data) ─────────────────────────────────────────────────────

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'update', label: 'Product Update' },
  { value: 'alert', label: 'Security Alert' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offer', label: 'Promotional Offer' },
];

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Silent In-App' },
  { value: 'normal', label: 'Normal', description: 'Standard Delivery' },
  { value: 'high', label: 'High', description: 'Highlighted Alert' },
  { value: 'urgent', label: 'Urgent', description: 'Banner + High Priority' },
];

const CHANNEL_OPTIONS: { key: ChannelKey; label: string; description: string }[] = [
  { key: 'in-app', label: 'In-App Bell', description: 'Instant popup' },
  { key: 'email', label: 'Email', description: 'SMTP Queue' },
  { key: 'push', label: 'Push Notice', description: 'Web Push API' },
];

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-400',
  basic: 'bg-blue-500',
  pro: 'bg-violet-500',
  advanced: 'bg-amber-500',
};

const LOG_STATUS_STYLES: Record<LogStatus, string> = {
  Delivered: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  Queued: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Sent: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  Failed: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const BROADCAST_MAX_LENGTH = 500;
const TITLE_MAX_LENGTH = 120;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminNotifications({ embedded = false }: { embedded?: boolean } = {}) {
  type SubTab = 'broadcast' | 'subscription' | 'automated' | 'logs';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('broadcast');

  // ── Plans (loaded from API) ─────────────────────────────────────────────────
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [tierStats, setTierStats] = useState<TierStat[]>([]);

  // ── Broadcast state ─────────────────────────────────────────────────────────
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<NotificationType>('announcement');
  const [broadcastPriority, setBroadcastPriority] = useState<PriorityLevel>('normal');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');
  const [broadcastActionLabel, setBroadcastActionLabel] = useState('');
  const [broadcastChannels, setBroadcastChannels] = useState<Record<ChannelKey, boolean>>({
    'in-app': true,
    email: false,
    push: false,
  });
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // ── Subscription-targeted state ─────────────────────────────────────────────
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [targetStatus, setTargetStatus] = useState<string>('all');
  const [subTitle, setSubTitle] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [subType, setSubType] = useState<NotificationType>('offer');
  const [subPriority, setSubPriority] = useState<PriorityLevel>('normal');
  const [subActionUrl, setSubActionUrl] = useState('');
  const [subChannels, setSubChannels] = useState<Record<ChannelKey, boolean>>({
    'in-app': true,
    email: true,
    push: false,
  });
  const [isSendingSub, setIsSendingSub] = useState(false);

  // ── Automated rules (loaded from API) ───────────────────────────────────────
  const [rules, setRules] = useState<AutomatedRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  // ── History / Logs ──────────────────────────────────────────────────────────
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // ── Local notification logs (merged: history + static) ──────────────────────
  const [logSearch, setLogSearch] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('all');

  // ── Detail modal ────────────────────────────────────────────────────────────
  const [viewLogDetail, setViewLogDetail] = useState<BroadcastHistoryItem | null>(null);

  // ─── Data Fetchers ──────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/admin/plans`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const plans: PlanOption[] = Array.isArray(data)
          ? data.map((p: any) => ({
              id: p.id ?? p.slug,
              name: p.name,
              slug: p.slug,
              memberCount: p.memberCount ?? p.userCount ?? undefined,
              color: TIER_COLORS[p.slug] ?? 'bg-gray-400',
            }))
          : [];
        setAvailablePlans(plans);

        // Build tier stats from the same API response
        const stats: TierStat[] = plans.map((p) => ({
          slug: p.slug,
          name: p.name,
          memberCount: p.memberCount ?? 0,
          color: TIER_COLORS[p.slug] ?? 'bg-gray-400',
        }));
        setTierStats(stats);

        // Default-select the first plan if none selected
        if (plans.length > 0) {
          setSelectedPlans([plans[0].slug]);
        }
      }
    } catch {
      toast.error('Unable to load subscription plans.');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const fetchBroadcastHistory = useCallback(
    async (page = 1) => {
      setHistoryLoading(true);
      try {
        const res = await fetch(NotificationAdminApiConfig.history(page, 20), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          // Handle both {items, total} and array responses
          const items: BroadcastHistoryItem[] = Array.isArray(data)
            ? data
            : data.items ?? data.data ?? [];
          const total: number = data.total ?? data.totalCount ?? items.length;
          setBroadcastHistory(items);
          setHistoryTotal(total);
          setHistoryPage(page);
        }
      } catch {
        // Silently fail — history is informational
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  const fetchAutomatedRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/notificationadmin/rules`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const ruleList: AutomatedRule[] = Array.isArray(data)
          ? data
          : data.items ?? data.data ?? [];
        setRules(ruleList);
      } else {
        setRules([]);
      }
    } catch {
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchBroadcastHistory(1);
    fetchAutomatedRules();
  }, [fetchPlans, fetchBroadcastHistory, fetchAutomatedRules]);

  // ─── Derived / Computed ──────────────────────────────────────────────────────

  const totalMembersFromTiers = useMemo(
    () => tierStats.reduce((acc, t) => acc + t.memberCount, 0),
    [tierStats]
  );

  const calculatedSubAudience = useMemo(() => {
    if (selectedPlans.length === 0) return 0;
    return tierStats
      .filter((t) => selectedPlans.includes(t.slug))
      .reduce((acc, t) => acc + t.memberCount, 0);
  }, [selectedPlans, tierStats]);

  const totalNotificationsSent = useMemo(
    () => broadcastHistory.reduce((acc, h) => acc + (h.recipientsCount ?? 0), 0),
    [broadcastHistory]
  );

  const filteredLogs = useMemo(() => {
    return broadcastHistory.filter((log) => {
      const searchLower = logSearch.toLowerCase();
      const matchesSearch =
        log.title.toLowerCase().includes(searchLower) ||
        log.message.toLowerCase().includes(searchLower);
      const matchesStatus =
        logFilterStatus === 'all' ||
        (log.status ?? '').toLowerCase() === logFilterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [broadcastHistory, logSearch, logFilterStatus]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) {
      toast.error('Please enter a notification title.');
      return;
    }
    if (!broadcastMessage.trim()) {
      toast.error('Please enter a notification message.');
      return;
    }
    const activeChannels = (Object.keys(broadcastChannels) as ChannelKey[]).filter(
      (k) => broadcastChannels[k]
    );
    if (activeChannels.length === 0) {
      toast.error('Select at least one delivery channel.');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const res = await fetch(NotificationAdminApiConfig.broadcast, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          priority: broadcastPriority,
          actionUrl: broadcastActionUrl.trim() || null,
          actionLabel: broadcastActionLabel.trim() || null,
          channels: activeChannels,
          targetPlanSlug: null,
          targetRole: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Request failed with status ${res.status}`);
      }
      const result = await res.json();
      const count = result?.data?.recipientsCount ?? result?.recipientsCount ?? 0;
      toast.success(
        count > 0
          ? `Broadcast queued for ${count.toLocaleString()} user${count !== 1 ? 's' : ''}. Processing asynchronously.`
          : 'Broadcast accepted and queued for processing.'
      );
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastActionUrl('');
      setBroadcastActionLabel('');
      fetchBroadcastHistory(1);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send broadcast. Please try again.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleSendSubscriptionNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim()) {
      toast.error('Please enter a notification title.');
      return;
    }
    if (!subMessage.trim()) {
      toast.error('Please enter a notification message.');
      return;
    }
    if (selectedPlans.length === 0) {
      toast.error('Please select at least one subscription tier.');
      return;
    }
    const activeChannels = (Object.keys(subChannels) as ChannelKey[]).filter(
      (k) => subChannels[k]
    );
    if (activeChannels.length === 0) {
      toast.error('Select at least one delivery channel.');
      return;
    }

    setIsSendingSub(true);
    try {
      let totalSent = 0;
      for (const planSlug of selectedPlans) {
        const res = await fetch(NotificationAdminApiConfig.broadcast, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: subTitle.trim(),
            message: subMessage.trim(),
            type: subType,
            priority: subPriority,
            actionUrl: subActionUrl.trim() || null,
            channels: activeChannels,
            targetPlanSlug: planSlug,
            targetRole: null,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          totalSent += result?.data?.recipientsCount ?? result?.recipientsCount ?? 0;
        }
      }
      toast.success(
        `Subscription notification queued for ${totalSent.toLocaleString()} user${
          totalSent !== 1 ? 's' : ''
        } across ${selectedPlans.length} plan${selectedPlans.length !== 1 ? 's' : ''}.`
      );
      setSubTitle('');
      setSubMessage('');
      fetchBroadcastHistory(1);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send notification.');
    } finally {
      setIsSendingSub(false);
    }
  };

  const toggleRule = useCallback(
    async (ruleId: string, newState: boolean) => {
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isActive: newState } : r))
      );
      try {
        await fetch(`${ApiConfig.Api_Base_Url}api/notificationadmin/rules/${ruleId}/toggle`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isActive: newState }),
        });
      } catch {
        // Revert on failure
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isActive: !newState } : r))
        );
        toast.error('Failed to update rule status.');
      }
    },
    []
  );

  const togglePlanSelection = (slug: string) => {
    setSelectedPlans((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // ─── Sub-tab config ───────────────────────────────────────────────────────────

  const subTabs: { id: SubTab; label: string; icon: React.ReactNode; badge?: number | string }[] =
    [
      { id: 'broadcast', label: 'Broadcast All', icon: <Radio className="w-4 h-4" /> },
      {
        id: 'subscription',
        label: 'By Subscription',
        icon: <CreditCard className="w-4 h-4" />,
        badge: availablePlans.length > 0 ? availablePlans.length : undefined,
      },
      {
        id: 'automated',
        label: 'Automated Rules',
        icon: <Zap className="w-4 h-4" />,
        badge: rules.filter((r) => r.isActive).length > 0 ? rules.filter((r) => r.isActive).length : undefined,
      },
      {
        id: 'logs',
        label: 'History',
        icon: <Inbox className="w-4 h-4" />,
        badge: historyTotal > 0 ? historyTotal : undefined,
      },
    ];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {!embedded && <AdminNavbar />}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-blue-950/30 p-6 rounded-2xl border border-violet-200/60 dark:border-violet-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Notification Management Center
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                Multi-Channel
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Broadcast to all members, target specific subscription tiers, and configure automated event-driven triggers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800/90 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Queue Worker:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active (Async Batching)</span>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Dispatched</span>
            <Send className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {historyLoading ? (
              <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              totalNotificationsSent.toLocaleString()
            )}
          </p>
          <span className="text-xs text-gray-400 mt-0.5 block">From {historyTotal} broadcasts</span>
        </div>

        {/* Automated Rules */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Automated Rules</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {rulesLoading ? (
              <span className="inline-block w-10 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              <>
                {rules.filter((r) => r.isActive).length}
                <span className="text-xs font-normal text-gray-400"> / {rules.length} Active</span>
              </>
            )}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">Event-driven background cron</span>
        </div>

        {/* Total Members */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Members</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {plansLoading ? (
              <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              totalMembersFromTiers.toLocaleString()
            )}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">Across {availablePlans.length} subscription tiers</span>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Subscription Plans</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {plansLoading ? (
              <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              availablePlans.length
            )}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">Active tier configurations</span>
        </div>
      </div>

      {/* ── Sub-Tab Navigation ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/60">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-[10px] font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: BROADCAST ALL ══════════════ */}
      {activeSubTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                <Radio className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Send Broadcast Notification
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dispatched asynchronously — returns immediately, processes in background.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Notification Title *
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {broadcastTitle.length}/{TITLE_MAX_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={TITLE_MAX_LENGTH}
                  placeholder="e.g. Important System Update — Action Required"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Type & Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notification Type
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} ({p.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Message Body *
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {broadcastMessage.length}/{BROADCAST_MAX_LENGTH} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={BROADCAST_MAX_LENGTH}
                  placeholder="Write clear, concise notification details for your users..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Optional CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Action Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. View Updates, Learn More"
                    value={broadcastActionLabel}
                    onChange={(e) => setBroadcastActionLabel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target URL / Route
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /dashboard or /roadmap"
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Dispatch Channels
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {CHANNEL_OPTIONS.map((ch) => (
                    <label
                      key={ch.key}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={broadcastChannels[ch.key]}
                        onChange={(e) =>
                          setBroadcastChannels((prev) => ({ ...prev, [ch.key]: e.target.checked }))
                        }
                        className="rounded text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block">
                          {ch.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{ch.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastTitle('');
                    setBroadcastMessage('');
                    setBroadcastActionUrl('');
                    setBroadcastActionLabel('');
                    setBroadcastType('announcement');
                    setBroadcastPriority('normal');
                  }}
                  className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-violet-500/20 transition-all cursor-pointer"
                >
                  {isSendingBroadcast ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting to Queue...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Broadcast to All Users</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Preview + Recent History */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Preview */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-violet-500" /> Live Preview
              </h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/60 dark:border-violet-800/40 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-violet-600 text-white shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      {broadcastTitle || 'Notification Title'}
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-3 leading-relaxed">
                      {broadcastMessage || 'Your notification message will appear here...'}
                    </p>
                    {broadcastActionLabel && (
                      <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-semibold">
                        {broadcastActionLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-violet-200/60 dark:border-violet-800/40">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-semibold">
                    {NOTIFICATION_TYPES.find((t) => t.value === broadcastType)?.label ?? broadcastType}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold capitalize">
                    {broadcastPriority} Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Broadcast History */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-violet-500" /> Recent Broadcasts
                </h3>
                <button
                  type="button"
                  onClick={() => fetchBroadcastHistory(1)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : broadcastHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No broadcast history yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {broadcastHistory.slice(0, 8).map((item, idx) => (
                    <div
                      key={item.id ?? idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {item.recipientsCount?.toLocaleString() ?? 0} recipients &middot;{' '}
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: BY SUBSCRIPTION ══════════════ */}
      {activeSubTab === 'subscription' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Send Targeted Notification by Plan
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target specific subscription tiers with personalized messaging.
                </p>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Target Subscription Tiers *
              </label>
              {plansLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : availablePlans.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No subscription plans found.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availablePlans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPlans.includes(plan.slug)
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlans.includes(plan.slug)}
                        onChange={() => togglePlanSelection(plan.slug)}
                        className="rounded text-violet-600 focus:ring-violet-500"
                      />
                      <div className={`w-2 h-2 rounded-full ${plan.color ?? TIER_COLORS[plan.slug] ?? 'bg-gray-400'}`} />
                      <div>
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block">
                          {plan.name}
                        </span>
                        {plan.memberCount !== undefined && (
                          <span className="text-[10px] text-gray-400">
                            {plan.memberCount.toLocaleString()} members
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSendSubscriptionNotification} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={TITLE_MAX_LENGTH}
                  placeholder="Tailored subject for your targeted tier..."
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notification Type
                  </label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value as NotificationType)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={subPriority}
                    onChange={(e) => setSubPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    {PRIORITY_OPTIONS.filter((p) => p.value !== 'low').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} — {p.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Targeted Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={BROADCAST_MAX_LENGTH}
                  placeholder="Craft your message tailored to this specific subscription tier..."
                  value={subMessage}
                  onChange={(e) => setSubMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* CTA Link & Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Destination URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={subActionUrl}
                    onChange={(e) => setSubActionUrl(e.target.value)}
                    placeholder="/plans or /settings/billing"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Dispatch Channels
                  </label>
                  <div className="flex gap-3">
                    {CHANNEL_OPTIONS.map((ch) => (
                      <label key={ch.key} className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subChannels[ch.key]}
                          onChange={(e) => setSubChannels((p) => ({ ...p, [ch.key]: e.target.checked }))}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        <span>{ch.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingSub || selectedPlans.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-violet-500/20 transition-all cursor-pointer"
                >
                  {isSendingSub ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending to Segment...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        Send to{' '}
                        {calculatedSubAudience > 0
                          ? `~${calculatedSubAudience.toLocaleString()} `
                          : ''}
                        Target Subscribers
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Tier Breakdown */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-violet-500" /> Subscription Breakdown
              </h3>
              {plansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : tierStats.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No tier data available.</p>
              ) : (
                <div className="space-y-3">
                  {tierStats.map((tier) => (
                    <div
                      key={tier.slug}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                          {tier.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {tier.memberCount.toLocaleString()}
                        </span>
                        {totalMembersFromTiers > 0 && (
                          <span className="block text-[10px] text-gray-400">
                            {((tier.memberCount / totalMembersFromTiers) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {totalMembersFromTiers > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50">
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                        Total Audience
                      </span>
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                        {totalMembersFromTiers.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audience Preview */}
            {selectedPlans.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4 rounded-2xl border border-violet-200/60 dark:border-violet-800/40">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                    Estimated Audience Reach
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {calculatedSubAudience.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">users</span>
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Across {selectedPlans.length} selected plan{selectedPlans.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: AUTOMATED RULES ══════════════ */}
      {activeSubTab === 'automated' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Automated Event-Driven Rules
              </h2>
              {!rulesLoading && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                  {rules.filter((r) => r.isActive).length} / {rules.length} Active
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchAutomatedRules}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh rules"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${rulesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {rulesLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="p-10 text-center">
              <Zap className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No automated rules configured
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Automated rules are configured server-side. Contact your system administrator.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {rules.map((rule) => (
                <div key={rule.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {rule.triggerEvent}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rule.conditionDescription}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {rule.targetTier}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rule.timingOffset}
                      </span>
                      {rule.lastTriggeredAt && (
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" /> Last: {rule.lastTriggeredAt}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> {rule.totalTriggered.toLocaleString()} fired
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {rule.channels.map((ch) => (
                        <span
                          key={ch}
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id, !rule.isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        rule.isActive ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={rule.isActive}
                      title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          rule.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold ${rule.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {rule.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB: HISTORY / LOGS ══════════════ */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Notification History
              </h2>
              {!historyLoading && (
                <span className="text-xs text-gray-400">({historyTotal} total)</span>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full sm:w-52 pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={logFilterStatus}
                  onChange={(e) => setLogFilterStatus(e.target.value)}
                  className="pl-7 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="delivered">Delivered</option>
                  <option value="queued">Queued</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => fetchBroadcastHistory(historyPage)}
                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Notification Subject</th>
                  <th className="py-3.5 px-4">Dispatched</th>
                  <th className="py-3.5 px-4">Recipients</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {historyLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="py-3 px-4">
                        <div className="h-8 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      {logSearch || logFilterStatus !== 'all'
                        ? 'No notifications match your filters.'
                        : 'No broadcast history yet. Send your first notification above.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr
                      key={log.id ?? idx}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {log.title}
                        </div>
                        <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {log.message}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {new Date(log.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                        {(log.recipientsCount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            LOG_STATUS_STYLES[(log.status as LogStatus) ?? 'Queued'] ?? LOG_STATUS_STYLES['Queued']
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {log.status ?? 'Queued'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewLogDetail(log)}
                          className="px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {historyTotal > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">
                Page {historyPage} of {Math.ceil(historyTotal / 20)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => fetchBroadcastHistory(historyPage - 1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={historyPage >= Math.ceil(historyTotal / 20)}
                  onClick={() => fetchBroadcastHistory(historyPage + 1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ Detail Modal ══════════════ */}
      {viewLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl relative space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  Broadcast Detail
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {viewLogDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewLogDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {viewLogDetail.message}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Total Recipients</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {(viewLogDetail.recipientsCount ?? 0).toLocaleString()} Users
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Dispatched At</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {new Date(viewLogDetail.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Delivery Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {viewLogDetail.status ?? 'Queued'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Broadcast ID</span>
                <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 truncate block">
                  {viewLogDetail.id ?? 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewLogDetail(null)}
                className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
