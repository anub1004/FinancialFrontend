const Api_Base_Url = "https://localhost:7085/";

export interface PaginatedApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  defaultOffset: number;
}
export function buildPaginatedUrl(
  config: PaginatedApiConfig,
  offset: number = config.defaultOffset
): string {
  const separator = config.baseUrl.includes("?") ? "&" : "?";
  return `${config.baseUrl}${separator}offset=${offset}`;
}
export const NewsApiConfig: { url: string; headers?: Record<string, string> } = {
  url: "https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=IYZGX3KEXVKKM26C",
  headers: {"C_xj2AuN0TlcYPc4eGc4NKFk2yk4GYe77edJgo-OstigUAUB": "true"},
};
export const NewApiConfig: PaginatedApiConfig = {
  baseUrl: "https://api.apilayer.com/financelayer/news?date=today&keywords=stocks&sort=desc",
  headers: {"apikey": "RoSTgPutP9kQf7W7Et1jf7BPywbZZ1"},
  defaultOffset: 0,
}; 

export const NewsApiConfig2: PaginatedApiConfig = {
  baseUrl: "https://api.apilayer.com/financelayer/news?date=today&fallback=off&sort=desc",
  headers: {"apikey": "RoSTgPutP9kQf7W7Et1jf7BPywbZZ1"},
  defaultOffset: 0,
};

export const DatabaseFinanceNewsConfig = {
  url: `${Api_Base_Url}api/FinanceNews`,
};

export const DatabaseTodayNewsConfig = {
  url: `${Api_Base_Url}api/TodayNews`,
};

export const ApiConfig = {
  Api_Base_Url,
};

// ── Sprint 1: Core Financial API Endpoints ──────────────────────────────
export const TransactionApiConfig = {
  list: `${Api_Base_Url}api/transactions`,
  summary: `${Api_Base_Url}api/transactions/summary`,
  categories: `${Api_Base_Url}api/transactions/categories`,
  byId: (id: string) => `${Api_Base_Url}api/transactions/${id}`,
};

export const InvestmentApiConfig = {
  list: `${Api_Base_Url}api/investments`,
  summary: `${Api_Base_Url}api/investments/summary`,
  byId: (id: string) => `${Api_Base_Url}api/investments/${id}`,
};

export const GoalApiConfig = {
  list: `${Api_Base_Url}api/goals`,
  byId: (id: string) => `${Api_Base_Url}api/goals/${id}`,
  contribute: (id: string) => `${Api_Base_Url}api/goals/${id}/contribute`,
  status: (id: string) => `${Api_Base_Url}api/goals/${id}/status`,
};

export const DashboardApiConfig = {
  summary: `${Api_Base_Url}api/dashboard/summary`,
  monthlyTrend: `${Api_Base_Url}api/dashboard/monthly-trend`,
  categoryBreakdown: `${Api_Base_Url}api/dashboard/category-breakdown`,
  recentActivity: `${Api_Base_Url}api/dashboard/recent-activity`,
};

// ── Portfolio Management API Endpoints ──────────────────────────────────
export const PortfolioApiConfig = {
  list: `${Api_Base_Url}api/portfolio`,
  summary: `${Api_Base_Url}api/portfolio/summary`,
  byId: (id: string) => `${Api_Base_Url}api/portfolio/${id}`,
};

// ── Tax Reports API Endpoints ───────────────────────────────────────────
export const TaxApiConfig = {
  list: (fy: string = "2025-26") => `${Api_Base_Url}api/tax?fy=${fy}`,
  byId: (id: string) => `${Api_Base_Url}api/tax/${id}`,
  compute: (fy: string = "2025-26") => `${Api_Base_Url}api/tax/compute?fy=${fy}`,
  report: (fy: string = "2025-26") => `${Api_Base_Url}api/tax/report?fy=${fy}`,
  create: `${Api_Base_Url}api/tax`,
};

// -- Notification API Endpoints ----------------------------------------------
export const NotificationApiConfig = {
  list: (page: number = 1, pageSize: number = 20, onlyUnread?: boolean) =>
    `${Api_Base_Url}api/notification?page=${page}&pageSize=${pageSize}${onlyUnread != null ? `&onlyUnread=${onlyUnread}` : ''}`,
  unreadCount: `${Api_Base_Url}api/notification/unread-count`,
  markRead: (id: string) => `${Api_Base_Url}api/notification/${id}/read`,
  markAllRead: `${Api_Base_Url}api/notification/read-all`,
};

export const NotificationAdminApiConfig = {
  broadcast: `${Api_Base_Url}api/notificationadmin/broadcast`,
  history: (page: number = 1, pageSize: number = 20) =>
    `${Api_Base_Url}api/notificationadmin/history?page=${page}&pageSize=${pageSize}`,
};
