let Api_Base_Url = "https://localhost:7085/";

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
  headers: {"apikey": "UqLwn3LNQqxxdJ8I1tGWOgW1JhNSRTDo"},
  defaultOffset: 0,
}; 

export const NewsApiConfig2: PaginatedApiConfig = {
  baseUrl: "https://api.apilayer.com/financelayer/news?date=today&fallback=off&sort=desc",
  headers: {"apikey": "UqLwn3LNQqxxdJ8I1tGWOgW1JhNSRTDo"},
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
