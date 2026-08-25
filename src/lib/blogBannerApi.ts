import { ApiConfig } from "../config/apiconfig";

export interface BannerResult {
  url: string;
  imageUrl: string | null;
  title: string | null;
  description: string | null;
  success: boolean;
  error: string | null;
}

export async function fetchBanners(blogUrls: string[]): Promise<BannerResult[]> {
  const token = localStorage.getItem("token");

  const res = await fetch(ApiConfig.Api_Base_Url + "api/Blog/fetch-banners", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ urls: blogUrls }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}
