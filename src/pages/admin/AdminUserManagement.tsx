import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import AdminNavbar from "./AdminNavbar";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasGoogleLogin: boolean;
  hasTotpConfigured: boolean;
  profilePicture?: string;
  currentPlanName?: string;
  subscriptionStatus?: string;
}

interface UserDetail {
  id: string;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasGoogleLogin: boolean;
  hasTotpConfigured: boolean;
  profilePicture?: string;
  subscriptions: {
    subscriptionId: string;
    planName: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    cancelledAt?: string;
  }[];
  paymentCount: number;
  totalPayments: number;
}

interface PageResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: AdminUser[];
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: { roleName: string; count: number }[];
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  usersWithActiveSubscriptions: number;
  asOf: string;
}

interface RoleOption {
  id: number;
  name: string;
  isActive: boolean;
}



export default function AdminUserManagement({ embedded = false }: { embedded?: boolean } = {}) {
  const { authState } = useAuth();
  

  // Data 
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersResult, setUsersResult] = useState<PageResult | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

 //Search Sort States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  //UI States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/users/stats", {
        credentials: "include",
        headers,
      });
      if (res.ok) setStats(await res.json());
    } catch {
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/admin/users/roles", {
        credentials: "include",
        headers,
      });
      if (res.ok) setRoles(await res.json());
    } catch {
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter !== "") params.set("isActive", statusFilter);
      const res = await fetch(
        ApiConfig.Api_Base_Url + `api/admin/users?${params}`,
        { credentials: "include", headers }
      );
      if (res.ok) setUsersResult(await res.json());
    } catch {
    }
  }, [page, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUserDetail = async (userId: string) => {
    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + `api/admin/users/${userId}`,
        { credentials: "include", headers }
      );
      if (res.ok) {
        setSelectedUser(await res.json());
        setDetailOpen(true);
      }
    } catch {
      toast.error("Failed to load user details");
    }
  };

 
  useEffect(() => {
    Promise.all([fetchStats(), fetchRoles()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);


  const toggleUserStatus = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + `api/admin/users/${user.id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify({ isActive: !user.isActive }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async () => {
    if (!roleModalUser || !newRole) return;
    setActionLoading(roleModalUser.id);
    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + `api/admin/users/${roleModalUser.id}/role`,
        {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify({ roleName: newRole }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setRoleModalOpen(false);
        setRoleModalUser(null);
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to change role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(
        ApiConfig.Api_Base_Url + `api/admin/users/${userId}`,
        { method: "DELETE", credentials: "include", headers }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setDeleteConfirmId(null);
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete user");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter !== "") params.set("isActive", statusFilter);

      const res = await fetch(
        ApiConfig.Api_Base_Url + `api/admin/users/export?${params}`,
        { credentials: "include", headers }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
      }
    } catch {
      toast.error("Export failed");
    }
  };


  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="ml-1 inline-block">
      {sortBy === column ? (
        sortOrder === "asc" ? (
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        ) : (
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )
      ) : (
        <svg className="w-3 h-3 inline opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
      )}
    </span>
  );

  if (authState.role !== "Admin")
    return (
      <div className="p-8 text-center text-red-500 font-semibold">
        Admin access required
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );


  const statCards = stats
    ? [
        {
          label: "Total Users",
          value: stats.totalUsers,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          ),
          color: "text-violet-600 dark:text-violet-400",
          bg: "bg-violet-50 dark:bg-violet-900/30",
          border: "border-violet-200 dark:border-violet-800",
        },
        {
          label: "Active",
          value: stats.activeUsers,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ),
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-900/30",
          border: "border-emerald-200 dark:border-emerald-800",
        },
        {
          label: "Inactive",
          value: stats.inactiveUsers,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          ),
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/30",
          border: "border-red-200 dark:border-red-800",
        },
        {
          label: "New (7d)",
          value: stats.newUsersLast7Days,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ),
          color: "text-sky-600 dark:text-sky-400",
          bg: "bg-sky-50 dark:bg-sky-900/30",
          border: "border-sky-200 dark:border-sky-800",
        },
        {
          label: "New (30d)",
          value: stats.newUsersLast30Days,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          ),
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-900/30",
          border: "border-amber-200 dark:border-amber-800",
        },
        {
          label: "Subscribed",
          value: stats.usersWithActiveSubscriptions,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
          ),
          color: "text-indigo-600 dark:text-indigo-400",
          bg: "bg-indigo-50 dark:bg-indigo-900/30",
          border: "border-indigo-200 dark:border-indigo-800",
        },
      ]
    : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all registered users, roles, and account statuses
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

    
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl ${s.bg} p-4 border ${s.border} transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`${s.color}`}>{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

    
      {stats && stats.usersByRole.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            Users by Role
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.usersByRole.map((r) => (
              <button
                key={r.roleName}
                onClick={() => {
                  setRoleFilter(roleFilter === r.roleName ? "" : r.roleName);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                  roleFilter === r.roleName
                    ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 ring-2 ring-violet-400/30"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600"
                }`}
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {r.roleName}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full">
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

  
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
              />
            </div>

        
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-400/40"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

   
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-400/40"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

  
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("username")}>
                  User <SortIcon column="username" />
                </th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("email")}>
                  Email <SortIcon column="email" />
                </th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("role")}>
                  Role <SortIcon column="role" />
                </th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Security</th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("isactive")}>
                  Status <SortIcon column="isactive" />
                </th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("createdAt")}>
                  Created <SortIcon column="createdAt" />
                </th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {usersResult?.items.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-100"
                >
                 
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {user.hasGoogleLogin && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center" title="Google Account">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => fetchUserDetail(user.id)}
                        className="font-medium text-gray-800 dark:text-gray-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                      >
                        {user.username}
                      </button>
                    </div>
                  </td>

                
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                    {user.email}
                  </td>

            
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        user.roleName === "Admin"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                          : user.roleName === "Manager"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                          : user.roleName === "Auditor"
                          ? "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {user.roleName}
                    </span>
                  </td>

              
                  <td className="px-5 py-3">
                    {user.currentPlanName ? (
                      <div className="flex flex-col">
                        <span className="text-gray-800 dark:text-gray-200 text-xs font-medium">
                          {user.currentPlanName}
                        </span>
                        <span
                          className={`text-[10px] font-medium mt-0.5 ${
                            user.subscriptionStatus === "Active"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : user.subscriptionStatus === "Trial"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400"
                          }`}
                        >
                          {user.subscriptionStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No plan</span>
                    )}
                  </td>

          
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.hasTotpConfigured && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded"
                          title="TOTP 2FA Enabled"
                        >
                          2FA
                        </span>
                      )}
                      {user.hasGoogleLogin && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded"
                          title="Google SSO"
                        >
                          SSO
                        </span>
                      )}
                      {!user.hasTotpConfigured && !user.hasGoogleLogin && (
                        <span className="text-[10px] text-gray-400">
                          Password only
                        </span>
                      )}
                    </div>
                  </td>

                
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      disabled={actionLoading === user.id}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:ring-offset-1 disabled:opacity-50"
                      style={{
                        backgroundColor: user.isActive ? "#10b981" : "#94a3b8",
                      }}
                      title={user.isActive ? "Click to disable" : "Click to enable"}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          user.isActive ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>

             
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

               
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                    
                      <button
                        onClick={() => fetchUserDetail(user.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 dark:hover:text-violet-400 transition-colors"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>

                     
                      <button
                        onClick={() => {
                          setRoleModalUser(user);
                          setNewRole(user.roleName);
                          setRoleModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors"
                        title="Change role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </button>

                  
                      <button
                        onClick={() => setDeleteConfirmId(user.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {(!usersResult || usersResult.items.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-gray-400"
                  >
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth={1} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M23 21v-2a4 4 0 00-3-3.87" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 3.13a4 4 0 010 7.75" /></svg>
                    No users found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

  
        {usersResult && usersResult.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {(usersResult.page - 1) * usersResult.pageSize + 1}â€“
              {Math.min(
                usersResult.page * usersResult.pageSize,
                usersResult.total
              )}{" "}
              of {usersResult.total} users
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                &#8592; Prev
              </button>
              
              {Array.from(
                { length: Math.min(5, usersResult.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (usersResult.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= usersResult.totalPages - 2) {
                    pageNum = usersResult.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? "bg-violet-600 text-white"
                          : "border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
              <button
                disabled={page >= usersResult.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next &#8594;
              </button>
            </div>
          </div>
        )}
      </div>

      
      {detailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDetailOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                User Details
              </h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
            
              <div className="flex items-center gap-4">
                {selectedUser.profilePicture ? (
                  <img
                    src={selectedUser.profilePicture}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-violet-100 dark:ring-violet-900/40"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-violet-100 dark:ring-violet-900/40">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedUser.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        selectedUser.roleName === "Admin"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                          : selectedUser.roleName === "Manager"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {selectedUser.roleName}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        selectedUser.isActive
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

      {/* ── Admin Navigation ── */}
      {!embedded && <AdminNavbar />}

<div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Created</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Updated</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {new Date(selectedUser.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Total Payments</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    &#8377;{selectedUser.totalPayments.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Payment Count</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {selectedUser.paymentCount}
                  </div>
                </div>
              </div>

            
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Security</h4>
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${selectedUser.hasTotpConfigured ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                    {selectedUser.hasTotpConfigured ? "\u2713 2FA Enabled" : "\u2717 2FA Not Set"}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${selectedUser.hasGoogleLogin ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                    {selectedUser.hasGoogleLogin ? "\u2713 Google SSO" : "\u2717 No SSO"}
                  </span>
                </div>
              </div>

             
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Subscriptions ({selectedUser.subscriptions.length})
                </h4>
                {selectedUser.subscriptions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.subscriptions.map((sub) => (
                      <div key={sub.subscriptionId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{sub.planName}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            sub.status === "Active" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : sub.status === "Trial" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            : sub.status === "Cancelled" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}>{sub.status}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
                          <div>{sub.billingCycle} &bull; {new Date(sub.startDate).toLocaleDateString()} &rarr; {new Date(sub.endDate).toLocaleDateString()}</div>
                          <div>Auto-renew: {sub.autoRenew ? "Yes" : "No"}
                            {sub.cancelledAt && <span className="text-red-500 ml-2">Cancelled {new Date(sub.cancelledAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No subscription history</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    
      {roleModalOpen && roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRoleModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Change Role</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Update role for <strong>{roleModalUser.username}</strong>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 mb-4 focus:ring-2 focus:ring-violet-400/40"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRoleModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button
                onClick={changeRole}
                disabled={newRole === roleModalUser.roleName || actionLoading === roleModalUser.id}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                {actionLoading === roleModalUser.id ? (
                  <span className="flex items-center gap-2"><span className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />Saving...</span>
                ) : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Delete User</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This will deactivate the user account.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button
                onClick={() => deleteUser(deleteConfirmId)}
                disabled={actionLoading === deleteConfirmId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                {actionLoading === deleteConfirmId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

   
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
