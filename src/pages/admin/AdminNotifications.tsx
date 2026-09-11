import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminNavbar from './AdminNavbar';
import { ApiConfig, NotificationAdminApiConfig } from '../../config/apiconfig';

// Types
export type NotificationType = 'announcement' | 'update' | 'alert' | 'maintenance' | 'offer';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export interface AutomatedRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditionDescription: string;
  targetTier: string;
  timingOffset: string;
  channels: ('in-app' | 'email' | 'push')[];
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
  channels: ('in-app' | 'email' | 'push')[];
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Queued' | 'Failed';
  recipientCount: number;
  openRate?: string;
  actionUrl?: string;
}

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_PLANS: PlanOption[] = [
  { id: 'free', name: 'Free Tier', slug: 'free' },
  { id: 'basic', name: 'Basic Starter', slug: 'basic' },
  { id: 'pro', name: 'Pro Plan', slug: 'pro' },
  { id: 'advanced', name: 'Advanced Enterprise', slug: 'advanced' },
];

const INITIAL_RULES: AutomatedRule[] = [
  {
    id: 'rule-1',
    name: 'Trial Expiration Notice',
    triggerEvent: 'TRIAL_EXPIRING', 
    conditionDescription: 'Fires 3 days before free trial expires',
    targetTier: 'Trial Users (All Plans)',
    timingOffset: '3 days before expiry',
    channels: ['in-app', 'email'],
    titleTemplate: 'Your {{plan_name}} trial ends in {{days_left}} days!',
    messageTemplate: 'Hi {{user_name}}, your trial period is coming to an end on {{expiry_date}}. Upgrade now to keep uninterrupted access to real-time analytics.',
    isActive: true,
    lastTriggeredAt: 'Today at 09:15 AM',
    totalTriggered: 142,
  },
  {
    id: 'rule-2',
    name: 'Subscription Renewal Alert',
    triggerEvent: 'RENEWAL_UPCOMING',
    conditionDescription: 'Fires 5 days before upcoming billing cycle',
    targetTier: 'Active Paid Subscribers',
    timingOffset: '5 days before renewal',
    channels: ['email', 'in-app'],
    titleTemplate: 'Upcoming renewal for your {{plan_name}} plan',
    messageTemplate: 'Hello {{user_name}}, this is a courtesy notice that your subscription will renew on {{expiry_date}}. Check payment method to ensure uninterrupted service.',
    isActive: true,
    lastTriggeredAt: 'Yesterday at 04:30 PM',
    totalTriggered: 298,
  },
  {
    id: 'rule-3',
    name: 'Payment Failed / Dunning Notice',
    triggerEvent: 'PAYMENT_FAILED',
    conditionDescription: 'Fires instantly on recurring charge failure',
    targetTier: 'Past Due / Failed Invoices',
    timingOffset: 'Immediate trigger',
    channels: ['in-app', 'email', 'push'],
    titleTemplate: 'Action Required: Payment failed for {{plan_name}}',
    messageTemplate: 'We were unable to process your payment for {{plan_name}}. Please update your billing info to avoid account suspension.',
    isActive: true,
    lastTriggeredAt: '2 days ago',
    totalTriggered: 19,
  },
  {
    id: 'rule-4',
    name: 'Usage Quota Reached (85%)',
    triggerEvent: 'QUOTA_THRESHOLD',
    conditionDescription: 'Fires when API/transaction quota exceeds 85%',
    targetTier: 'Free & Basic Users',
    timingOffset: 'Immediate on threshold hit',
    channels: ['in-app'],
    titleTemplate: "You have used 85% of your monthly limit",
    messageTemplate: "Hi {{user_name}}, you are approaching your tier monthly transaction quota. Upgrade to Pro for unlimited usage!",
    isActive: true,
    lastTriggeredAt: '3 days ago',
    totalTriggered: 521,
  },
  {
    id: 'rule-5',
    name: 'Inactive User Re-Engagement',
    triggerEvent: 'INACTIVITY_21D',
    conditionDescription: 'Fires when user has no activity for 21 days',
    targetTier: 'Inactive Registered Users',
    timingOffset: '21 days after last login',
    channels: ['email'],
    titleTemplate: 'We miss you! See your updated financial summary',
    messageTemplate: "Hi {{user_name}}, new features have been added to your dashboard. Log in today to review your investment trends!",
    isActive: false,
    lastTriggeredAt: '1 week ago',
    totalTriggered: 84,
  },
  {
    id: 'rule-6',
    name: 'Welcome & Onboarding Sequence',
    triggerEvent: 'USER_REGISTERED',
    conditionDescription: 'Fires 10 minutes after initial user registration',
    targetTier: 'New Signups (All Plans)',
    timingOffset: '10 min post registration',
    channels: ['in-app', 'email'],
    titleTemplate: 'Welcome to Financial Hub, {{user_name}}!',
    messageTemplate: 'Welcome aboard! Start by connecting your first account or setting up monthly budgets in just 2 minutes.',
    isActive: true,
    lastTriggeredAt: '1 hour ago',
    totalTriggered: 764,
  },
];

const INITIAL_LOGS: NotificationLog[] = [
  {
    id: 'log-101',
    title: 'Scheduled Maintenance: System Upgrade Tonight',
    message: 'We will be performing planned database upgrades from 02:00 to 03:00 UTC. Brief intermittent downtime may occur.',
    type: 'maintenance',
    priority: 'high',
    targetAudience: 'All Users (1,248)',
    channels: ['in-app', 'email'],
    sentAt: '2026-09-08 18:30',
    status: 'Delivered',
    recipientCount: 1248,
    openRate: '78.4%',
  },
  {
    id: 'log-102',
    title: 'Exclusive 25% Off Annual Pro Upgrade',
    message: 'Unlock AI-powered financial forecasts and unlimited tax computations. Limited time promotion for starter members.',
    type: 'offer',
    priority: 'normal',
    targetAudience: 'Free & Basic Tiers',
    channels: ['in-app', 'email', 'push'],
    sentAt: '2026-09-06 11:00',
    status: 'Delivered',
    recipientCount: 684,
    openRate: '54.2%',
    actionUrl: '/plans',
  },
  {
    id: 'log-103',
    title: 'New Feature: Automated Goal Tracking Released',
    message: 'You can now set recurring milestone tracking on all your financial goals directly from the dashboard.',
    type: 'update',
    priority: 'normal',
    targetAudience: 'Pro & Enterprise Tiers',
    channels: ['in-app'],
    sentAt: '2026-09-04 15:45',
    status: 'Delivered',
    recipientCount: 420,
    openRate: '89.1%',
  },
  {
    id: 'log-104',
    title: 'Security Advisory: Two-Factor Authentication Recommended',
    message: 'Enhance your financial account security by enabling two-factor authentication in your account settings.',
    type: 'alert',
    priority: 'urgent',
    targetAudience: 'All Users (1,248)',
    channels: ['in-app', 'push'],
    sentAt: '2026-08-30 10:15',
    status: 'Delivered',
    recipientCount: 1248,
    openRate: '82.6%',
  },
];

export default function AdminNotifications({ embedded = false }: { embedded?: boolean } = {}) {
  // Navigation tabs inside Notifications Hub
  const [activeSubTab, setActiveSubTab] = useState<'broadcast' | 'subscription' | 'automated' | 'logs'>('broadcast');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<NotificationType>('announcement');
  const [broadcastPriority, setBroadcastPriority] = useState<PriorityLevel>('normal');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');
  const [broadcastActionLabel, setBroadcastActionLabel] = useState('');
  const [broadcastChannels, setBroadcastChannels] = useState<Record<'in-app' | 'email' | 'push', boolean>>({
    'in-app': true,
    email: false,
    push: false,
  });
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Subscription-based state
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>(DEFAULT_PLANS);
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['free', 'basic']);
  const [targetStatus, setTargetStatus] = useState<string>('all');
  const [subTitle, setSubTitle] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [subType, setSubType] = useState<NotificationType>('offer');
  const [subPriority, setSubPriority] = useState<PriorityLevel>('normal');
  const [subActionUrl, setSubActionUrl] = useState('/plans');
  const [subChannels, setSubChannels] = useState<Record<'in-app' | 'email' | 'push', boolean>>({
    'in-app': true,
    email: true,
    push: false,
  });
  const [isSendingSub, setIsSendingSub] = useState(false);

  // Automated rules state
  const [rules, setRules] = useState<AutomatedRule[]>(() => {
    const saved = localStorage.getItem('admin_notification_rules');
    return saved ? JSON.parse(saved) : INITIAL_RULES;
  });

  // Logs state
  const [logs, setLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('admin_notification_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });
  const [logSearch, setLogSearch] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('all');

  // Preview Modal / Details modal
  const [viewLogDetail, setViewLogDetail] = useState<NotificationLog | null>(null);

  // Broadcast history loaded from real API
  const [broadcastHistory, setBroadcastHistory] = useState<Array<{title: string; message: string; recipientsCount: number; createdAt: string}>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch real plans if possible
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${ApiConfig.Api_Base_Url}api/admin/plans`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAvailablePlans(
              data.map((p: any) => ({
                id: p.id || p.slug,
                name: p.name,
                slug: p.slug,
              }))
            );
          }
        }
      } catch {
        // Fallback to default plans already set
      }
    };
    fetchPlans();
  }, []);

  // Fetch broadcast history from real API
  const fetchBroadcastHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(NotificationAdminApiConfig.history(1, 20), {
        headers: token ? { Authorization: Bearer  } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastHistory(data.items ?? []);
      }
    } catch {
      // silently ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load broadcast history when on logs tab
  useEffect(() => {
    if (activeSubTab === 'logs') fetchBroadcastHistory();
  }, [activeSubTab]);

  // Save rules to localStorage on change
  const handleToggleRule = (id: string) => {
    setRules((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
      localStorage.setItem('admin_notification_rules', JSON.stringify(updated));
      return updated;
    });
    toast.success('Automated rule status updated');
  };

  // Trigger test run for an automated rule
  const handleTestTriggerRule = (rule: AutomatedRule) => {
    toast.loading(`Simulating trigger for "${rule.name}"...`, { duration: 1200 });
    setTimeout(() => {
      const newLog: NotificationLog = {
        id: `auto-${Date.now()}`,
        title: `[AUTO-DISPATCH] ${rule.name}`,
        message: rule.messageTemplate
          .replace('{{user_name}}', 'Alex Carter')
          .replace('{{plan_name}}', 'Pro Plan')
          .replace('{{days_left}}', '3')
          .replace('{{expiry_date}}', 'Sep 12, 2026'),
        type: 'update',
        priority: 'normal',
        targetAudience: rule.targetTier,
        channels: rule.channels,
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'Delivered',
        recipientCount: 38,
        openRate: 'Pending',
      };
      setLogs((prev) => {
        const updated = [newLog, ...prev];
        localStorage.setItem('admin_notification_logs', JSON.stringify(updated));
        return updated;
      });
      toast.success(`Automated trigger simulated! 38 test queue jobs dispatched.`);
    }, 1200);
  };

  // Dynamic calculated audience for Subscription-Based Tab
  const calculatedSubAudience = useMemo(() => {
    let base = 0;
    if (selectedPlans.includes('free')) base += 450;
    if (selectedPlans.includes('basic')) base += 320;
    if (selectedPlans.includes('pro')) base += 340;
    if (selectedPlans.includes('advanced')) base += 138;

    if (targetStatus === 'trial') base = Math.round(base * 0.22);
    else if (targetStatus === 'expiring') base = Math.round(base * 0.14);
    else if (targetStatus === 'past_due') base = Math.max(12, Math.round(base * 0.04));
    else if (targetStatus === 'active') base = Math.round(base * 0.85);

    return base;
  }, [selectedPlans, targetStatus]);

  // Handle Send Broadcast (To All Users)
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) {
      toast.error('Please enter a notification title');
      return;
    }
    if (!broadcastMessage.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    const activeChannels = (Object.keys(broadcastChannels) as ('in-app' | 'email' | 'push')[]).filter(
      (k) => broadcastChannels[k]
    );

    if (activeChannels.length === 0) {
      toast.error('Select at least one delivery channel');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(NotificationAdminApiConfig.broadcast, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          targetPlanSlug: null,
          targetRole: null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      const data = result.data ?? result;
      const recipientsCount = data.recipientsCount ?? 0;
      toast.success(`Broadcast sent to ${recipientsCount} user(s) successfully!`);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastActionUrl('');
      setBroadcastActionLabel('');
      // Refresh history
      fetchBroadcastHistory();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send broadcast. Please try again.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Handle Send Subscription-based Notification
  const handleSendSubscriptionNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim()) {
      toast.error('Please enter a notification title');
      return;
    }
    if (!subMessage.trim()) {
      toast.error('Please enter a notification message');
      return;
    }
    if (selectedPlans.length === 0) {
      toast.error('Please select at least one subscription tier');
      return;
    }

    const activeChannels = (Object.keys(subChannels) as ('in-app' | 'email' | 'push')[]).filter(
      (k) => subChannels[k]
    );
    if (activeChannels.length === 0) {
      toast.error('Select at least one delivery channel');
      return;
    }

    setIsSendingSub(true);
    try {
      const token = localStorage.getItem('token');
      let totalSent = 0;
      for (const planSlug of selectedPlans) {
        const res = await fetch(NotificationAdminApiConfig.broadcast, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ title: subTitle, message: subMessage, targetPlanSlug: planSlug, targetRole: null }),
        });
        if (res.ok) {
          const result = await res.json();
          totalSent += result?.data?.recipientsCount ?? result?.recipientsCount ?? 0;
        }
      }
      toast.success(`Subscription notification sent to ${totalSent} user(s) across ${selectedPlans.length} plan(s)!`);
      setSubTitle('');
      setSubMessage('');
      fetchBroadcastHistory();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send notification.');
    } finally {
      setIsSendingSub(false);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.title.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.targetAudience.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.message.toLowerCase().includes(logSearch.toLowerCase());
      const matchesStatus = logFilterStatus === 'all' || log.status.toLowerCase() === logFilterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [logs, logSearch, logFilterStatus]);

  // Quick Preset Selector for Subscription Tab
  const applyPreset = (presetKey: string) => {
    if (presetKey === 'pro_upgrade') {
      setSelectedPlans(['free', 'basic']);
      setTargetStatus('active');
      setSubTitle('🔥 Special Offer: Upgrade to Pro & Save 20%');
      setSubMessage(
        'Unlock unlimited tax reports, advanced portfolio metrics, and premium goal forecasting. Upgrade today using code PRO20.'
      );
      setSubType('offer');
      setSubPriority('normal');
      setSubActionUrl('/plans');
    } else if (presetKey === 'trial_ending') {
      setSelectedPlans(['pro', 'advanced']);
      setTargetStatus('trial');
      setSubTitle('⏳ Your 14-day trial is ending soon');
      setSubMessage(
        "You have 3 days left on your premium trial. Ensure your billing information is updated so you don't lose access to real-time analytics."
      );
      setSubType('alert');
      setSubPriority('high');
      setSubActionUrl('/settings/billing');
    } else if (presetKey === 'payment_past_due') {
      setSelectedPlans(['basic', 'pro', 'advanced']);
      setTargetStatus('past_due');
      setSubTitle('⚠️ Action Required: Subscription Payment Past Due');
      setSubMessage(
        'We were unable to process your recent renewal payment. Please update your payment card to avoid disruption to your financial reports.'
      );
      setSubType('alert');
      setSubPriority('urgent');
      setSubActionUrl('/settings/billing');
    } else if (presetKey === 'annual_discount') {
      setSelectedPlans(['pro']);
      setTargetStatus('active');
      setSubTitle('✨ Switch to Annual Billing & Get 2 Months Free');
      setSubMessage(
        'Switch your current monthly subscription to an annual plan and instantly receive 2 months completely free!'
      );
      setSubType('offer');
      setSubPriority('normal');
      setSubActionUrl('/plans');
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && <AdminNavbar />}

      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-blue-950/30 p-6 rounded-2xl border border-violet-200/60 dark:border-violet-800/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Notification Management Center
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                  Multi-Channel & Scalable
                </span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Broadcast to all members, target specific subscription tiers, and configure automated event-driven triggers.
              </p>
            </div>
          </div>
        </div>

        {/* Scalability Badge */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800/90 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Queue Worker:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active (Async Batching)</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Sent</span>
            <Send className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {logs.reduce((acc, l) => acc + l.recipientCount, 0).toLocaleString()}
          </p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> 99.8% delivery rate
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Automated Rules</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {rules.filter((r) => r.isActive).length}{' '}
            <span className="text-xs font-normal text-gray-400">/ {rules.length} Active</span>
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">Event-driven background cron</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Subscribers</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">798</p>
          <span className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 block">Targetable by Tier</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Open Rate</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">68.4%</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">In-App & Email combined</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700/80 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'broadcast'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Send to All Users (Broadcast)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subscription')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'subscription'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription-Based Notifications</span>
        </button>

        <button
          onClick={() => setActiveSubTab('automated')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'automated'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automated & Scalable Triggers</span>
          <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full">
            {rules.filter((r) => r.isActive).length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dispatch History & Queue</span>
          <span className="px-1.5 py-0.2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-semibold rounded-full">
            {logs.length}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: BROADCAST TO ALL USERS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Compose Form */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Compose Global Broadcast
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This notification will be dispatched to all 1,248 registered users in the database.
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Users className="w-3.5 h-3.5" /> Reach: ~1,248 Users
              </span>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notification Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Planned System Maintenance or New Feature Release"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Type & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category / Type
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    <option value="announcement">📣 Announcement</option>
                    <option value="update">🚀 Product Update</option>
                    <option value="alert">⚠️ Alert / Advisory</option>
                    <option value="maintenance">🛠️ Scheduled Maintenance</option>
                    <option value="offer">🎁 Special Offer</option>
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
                    <option value="low">Low (Silent In-App)</option>
                    <option value="normal">Normal (Standard Delivery)</option>
                    <option value="high">High (Highlighted Alert)</option>
                    <option value="urgent">Urgent (Banner + High Priority)</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Message Body *
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {broadcastMessage.length}/500 characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={500}
                  placeholder="Write clear, concise notification details for your users..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Optional CTA Action Link */}
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

              {/* Delivery Channels */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Dispatch Channels (Select multiple for omni-channel delivery)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastChannels['in-app']}
                      onChange={(e) =>
                        setBroadcastChannels((prev) => ({ ...prev, 'in-app': e.target.checked }))
                      }
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block">
                        In-App Bell
                      </span>
                      <span className="text-[10px] text-gray-400">Instant popup</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastChannels.email}
                      onChange={(e) =>
                        setBroadcastChannels((prev) => ({ ...prev, email: e.target.checked }))
                      }
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block">
                        Email
                      </span>
                      <span className="text-[10px] text-gray-400">SMTP Queue</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastChannels.push}
                      onChange={(e) =>
                        setBroadcastChannels((prev) => ({ ...prev, push: e.target.checked }))
                      }
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block">
                        Push Notice
                      </span>
                      <span className="text-[10px] text-gray-400">Web Push API</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastTitle('Scheduled Maintenance Notice: Sept 12');
                    setBroadcastMessage(
                      'Our servers will undergo scheduled performance optimization this Saturday from 02:00 UTC to 03:00 UTC. Your portfolio data remains safe and accessible.'
                    );
                    setBroadcastType('maintenance');
                    setBroadcastPriority('high');
                    setBroadcastActionLabel('System Status');
                    setBroadcastActionUrl('/dashboard');
                  }}
                  className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                >
                  Load Sample Template
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

          {/* Live Preview Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-violet-500" /> Live User Preview
              </h3>

              {/* In-App Dropdown Card Preview */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 shadow-inner">
                <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-2">
                  In-App Notification Item Preview:
                </span>

                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 shrink-0">
                    {broadcastType === 'maintenance' && <Sliders className="w-4 h-4" />}
                    {broadcastType === 'announcement' && <Radio className="w-4 h-4" />}
                    {broadcastType === 'update' && <Sparkles className="w-4 h-4" />}
                    {broadcastType === 'alert' && <AlertTriangle className="w-4 h-4" />}
                    {broadcastType === 'offer' && <Zap className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {broadcastTitle || 'Notification Subject Preview'}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">Just now</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed line-clamp-3">
                      {broadcastMessage ||
                        'Your notification body text will appear here. It will be displayed cleanly across all mobile and desktop devices.'}
                    </p>

                    {broadcastActionLabel && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                          {broadcastActionLabel} →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scalable Delivery Guarantee Note */}
              <div className="mt-4 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5">
                <div className="font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> High-Throughput Dispatch Engine
                </div>
                <p>
                  Broadcasting uses partitioned message queues and concurrency pools so delivery does not block user sessions or database transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: SUBSCRIPTION-BASED NOTIFICATIONS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'subscription' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Targeted Subscription Cohort
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send customized messaging according to member tier, status, or renewal triggers.
                </p>
              </div>

              {/* Dynamic Reach Counter */}
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Users className="w-3.5 h-3.5" /> Est. Reach: ~{calculatedSubAudience} Members
              </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="mb-5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                ⚡ Quick Campaign Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('pro_upgrade')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-violet-500 hover:text-violet-600 transition-colors cursor-pointer"
                >
                  🚀 Pro Upgrade Offer
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('trial_ending')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                >
                  ⏳ Trial Ending Soon (3 Days)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('payment_past_due')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  ⚠️ Payment Past Due
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('annual_discount')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-violet-500 hover:text-violet-600 transition-colors cursor-pointer"
                >
                  ✨ Annual Plan Discount
                </button>
              </div>
            </div>

            <form onSubmit={handleSendSubscriptionNotification} className="space-y-4">
              {/* Plan Tiers Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Target Subscription Tier(s) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availablePlans.map((plan) => {
                    const isChecked = selectedPlans.includes(plan.slug);
                    return (
                      <button
                        key={plan.slug}
                        type="button"
                        onClick={() => {
                          setSelectedPlans((prev) =>
                            prev.includes(plan.slug)
                              ? prev.filter((p) => p !== plan.slug)
                              : [...prev, plan.slug]
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{plan.name}</span>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Targeting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subscription Status Condition
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    <option value="all">All Subscribers in Selected Tiers</option>
                    <option value="active">Active Paying Only</option>
                    <option value="trial">Free Trial Users Only</option>
                    <option value="expiring">Expiring Within 7 Days</option>
                    <option value="past_due">Past Due / Grace Period</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notification Type
                  </label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value as NotificationType)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    <option value="offer">🎁 Special Promotion / Upgrade</option>
                    <option value="alert">⚠️ Renewal / Billing Alert</option>
                    <option value="update">🚀 Exclusive Tier Feature</option>
                    <option value="announcement">📣 Tier Announcement</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Targeted Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exclusive 20% discount on Pro Plan upgrade"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Targeted Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={500}
                  placeholder="Craft your message tailored to this specific subscription tier..."
                  value={subMessage}
                  onChange={(e) => setSubMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Action Link & Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Destination Link
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={subPriority}
                    onChange={(e) => setSubPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
                  >
                    <option value="normal">Normal Delivery</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Critical</option>
                  </select>
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Dispatch Channels
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subChannels['in-app']}
                      onChange={(e) => setSubChannels((p) => ({ ...p, 'in-app': e.target.checked }))}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>In-App Notification</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subChannels.email}
                      onChange={(e) => setSubChannels((p) => ({ ...p, email: e.target.checked }))}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>Email Notification</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subChannels.push}
                      onChange={(e) => setSubChannels((p) => ({ ...p, push: e.target.checked }))}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>Web Push</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingSub}
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
                      <span>Send to {calculatedSubAudience} Target Subscribers</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Breakdown & Tier Stats */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-violet-500" /> Subscription Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      Free Tier Members
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">450</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      Basic Starter
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">320</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      Pro Plan (Premium)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">340</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      Advanced Enterprise
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">138</span>
                </div>
              </div>

              {/* Conversion Optimization Tip */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Automated Conversion Triggers
                </div>
                <p>
                  Targeting free tier users with personalized upgrade incentives yields an average 18.2% conversion rate compared to untargeted broadcasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: AUTOMATED & SCALABLE NOTIFICATIONS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'automated' && (
        <div className="space-y-6">
          {/* Engine & Scalability Info Banner */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Automated Event-Driven Delivery Engine
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  These rules trigger automatically in the background when specific subscription milestones, payment webhooks, or inactivity thresholds are met.
                </p>
              </div>

              {/* Scalability spec chips */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                  <Server className="w-3 h-3 text-violet-500" /> Async Micro-Queues
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-blue-500" /> Concurrency: 4 Workers
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-500" /> Cron: Hourly Polling
                </span>
              </div>
            </div>
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  rule.isActive
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                    : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/60 opacity-80'
                }`}
              >
                <div>
                  {/* Top bar: title + toggle */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl text-white ${
                          rule.isActive ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-gray-400'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {rule.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 font-mono">
                          {rule.triggerEvent}
                        </span>
                      </div>
                    </div>

                    {/* Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.isActive ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          rule.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Condition & Timing */}
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                    {rule.conditionDescription}
                  </p>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Target Cohort:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {rule.targetTier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trigger Timing:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {rule.timingOffset}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Channels:</span>
                      <div className="flex gap-1">
                        {rule.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/50 text-[11px]">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block truncate">
                      Subject: {rule.titleTemplate}
                    </span>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 italic">
                      "{rule.messageTemplate}"
                    </p>
                  </div>
                </div>

                {/* Bottom stats & Test Button */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Triggered: <strong className="text-gray-700 dark:text-gray-200">{rule.totalTriggered}x</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTestTriggerRule(rule)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3" /> Simulate Run
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Variables Reference Guide */}
          <div className="p-5 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40">
            <h4 className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Dynamic Template Variables Available:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-900/40">
                <code className="font-bold text-violet-600 dark:text-violet-400 font-mono">
                  {'{{user_name}}'}
                </code>
                <span className="text-[11px] text-gray-500 block">Member full name</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-900/40">
                <code className="font-bold text-violet-600 dark:text-violet-400 font-mono">
                  {'{{plan_name}}'}
                </code>
                <span className="text-[11px] text-gray-500 block">Current subscription tier</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-900/40">
                <code className="font-bold text-violet-600 dark:text-violet-400 font-mono">
                  {'{{days_left}}'}
                </code>
                <span className="text-[11px] text-gray-500 block">Days before expiration</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-900/40">
                <code className="font-bold text-violet-600 dark:text-violet-400 font-mono">
                  {'{{expiry_date}}'}
                </code>
                <span className="text-[11px] text-gray-500 block">Calculated renewal date</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: DISPATCH HISTORY & AUDIT LOGS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs by subject, audience, or message..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="queued">Queued</option>
                <option value="failed">Failed</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setLogs(INITIAL_LOGS);
                  localStorage.removeItem('admin_notification_logs');
                  toast.success('Logs reset to default history');
                }}
                className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3.5 px-4">Notification Subject</th>
                  <th className="py-3.5 px-4">Target Segment</th>
                  <th className="py-3.5 px-4">Channels</th>
                  <th className="py-3.5 px-4">Dispatched</th>
                  <th className="py-3.5 px-4">Recipients</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No notification logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
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

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {log.targetAudience}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {log.channels.map((ch) => (
                            <span
                              key={ch}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {log.sentAt}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                        {log.recipientCount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            log.status === 'Delivered'
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : log.status === 'Queued'
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {log.status}
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
        </div>
      )}

      {/* Log Detail Modal */}
      {viewLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl relative space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  Dispatched Log Details
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
                <span className="text-gray-400 block text-[11px]">Target Audience</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {viewLogDetail.targetAudience}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Total Recipients</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {viewLogDetail.recipientCount.toLocaleString()} Users
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Dispatched Timestamp</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {viewLogDetail.sentAt}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <span className="text-gray-400 block text-[11px]">Delivery Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {viewLogDetail.status}
                </span>
              </div>
            </div>

            {viewLogDetail.actionUrl && (
              <div className="text-xs text-gray-500">
                Action Link: <code className="text-violet-600">{viewLogDetail.actionUrl}</code>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewLogDetail(null)}
                className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
