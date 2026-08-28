import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import {
  Shield, Loader, ChevronLeft, ChevronRight, Search,
  Filter, User, Clock, AlertTriangle, CheckCircle, Info
} from "lucide-react";

interface AuditEntry {
  auditLogId: number;
  userId: string;
  action: string;
  category: string;
  details: string;
  ipAddress: string | null;
  timestamp: string;
  user?: { username: string; email: string };
}

const ACTION_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  Login: { icon: <CheckCircle className="w-4 h-4" />, color: "text-emerald-500" },
  Logout: { icon: <Info className="w-4 h-4" />, color: "text-blue-500" },
  PasswordChange: { icon: <Shield className="w-4 h-4" />, color: "text-amber-500" },
  FailedLogin: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-500" },
  ProfileUpdate: { icon: <User className="w-4 h-4" />, color: "text-violet-500" },
  Default: { icon: <Clock className="w-4 h-4" />, color: "text-gray-400" },
};

function AuditLogViewer() {
  const { authState } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" };

  // Sample data for scaffold
  const SAMPLE_LOGS: AuditEntry[] = [
    { auditLogId: 1, userId: "user-1", action: "Login", category: "Authentication", details: "Successful login via email/password", ipAddress: "192.168.1.1", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { auditLogId: 2, userId: "user-1", action: "ProfileUpdate", category: "Account", details: "Updated profile picture and display name", ipAddress: "192.168.1.1", timestamp: new Date(Date.now() - 7200000).toISOString() },
    { auditLogId: 3, userId: "user-1", action: "PasswordChange", category: "Security", details: "Password changed successfully", ipAddress: "192.168.1.1", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { auditLogId: 4, userId: "user-1", action: "FailedLogin", category: "Authentication", details: "Failed login attempt - incorrect password", ipAddress: "10.0.0.1", timestamp: new Date(Date.now() - 172800000).toISOString() },
    { auditLogId: 5, userId: "user-1", action: "Login", category: "Authentication", details: "Successful login via Google OAuth", ipAddress: "192.168.1.2", timestamp: new Date(Date.now() - 259200000).toISOString() },
    { auditLogId: 6, userId: "user-1", action: "Logout", category: "Authentication", details: "User logged out", ipAddress: "192.168.1.2", timestamp: new Date(Date.now() - 345600000).toISOString() },
    { auditLogId: 7, userId: "user-1", action: "Login", category: "Authentication", details: "Successful login with 2FA verification", ipAddress: "192.168.1.3", timestamp: new Date(Date.now() - 432000000).toISOString() },
    { auditLogId: 8, userId: "user-1", action: "ProfileUpdate", category: "Account", details: "Email notification preferences updated", ipAddress: "192.168.1.3", timestamp: new Date(Date.now() - 518400000).toISOString() },
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call with sample data
    setTimeout(() => {
      let filtered = SAMPLE_LOGS;
      if (searchQuery) filtered = filtered.filter(l => l.action.toLowerCase().includes(searchQuery.toLowerCase()) || l.details.toLowerCase().includes(searchQuery.toLowerCase()));
      if (filterCategory) filtered = filtered.filter(l => l.category === filterCategory);
      setLogs(filtered);
      setLoading(false);
    }, 300);
  }, [searchQuery, filterCategory, page]);

  const getActionStyle = (action: string) => ACTION_ICONS[action] || ACTION_ICONS.Default;
  const categories = [...new Set(SAMPLE_LOGS.map(l => l.category))];

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete security and activity audit trail</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search audit logs..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Activity Log</h2>
          <span className="text-xs text-gray-400">{logs.length} entries</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader className="animate-spin text-violet-500 w-8 h-8" /></div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map(log => {
              const style = getActionStyle(log.action);
              return (
                <div key={log.auditLogId} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 ${style.color} shrink-0 mt-0.5`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.action.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">{log.category}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{log.details}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                        <span>{new Date(log.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4">
              <Shield className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No audit logs found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No matching entries in the activity log.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogViewer;
