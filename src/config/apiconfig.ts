let Api_Base_Url = "https://localhost:7085/";

// Configure your news API endpoint here
// For CORS issues, use a proxy endpoint on your own backend instead of a direct third-party URL.
// Example: url: Api_Base_Url + "api/News/proxy"
// Expected response format: array of objects with { title, description, url, urlToImage, source: { name }, publishedAt, author }
export const NewsApiConfig: { url: string; headers?: Record<string, string> } = {
  url: "https://api.currentsapi.services/v1/latest-news",
  headers: {"C_xj2AuN0TlcYPc4eGc4NKFk2yk4GYe77edJgo-OstigUAUB": "true"},
};
export const ApiConfig = {
  Api_Base_Url,
};
