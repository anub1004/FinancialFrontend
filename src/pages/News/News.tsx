import { useEffect, useState } from "react";
import NewsComponent from "../../Component/News/NewsComponent";
import { NewsApiConfig } from "../../config/apiconfig";

interface NewsArticle {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  source?: { name?: string; id?: string } | string;
  publishedAt?: string;
  author?: string;
}

function News() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("moneyControl");

  const fetchNews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(NewsApiConfig.url, {
        headers: NewsApiConfig.headers,
      });
      const json = await res.json();
      // Detect API-level error messages inside a 200 response
      if (json.error || json.status === "error") {
        throw new Error(
          json.error?.message || json.message || "API returned an error",
        );
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const articles = json.articles || json.data || json.value || json;
      setNews(Array.isArray(articles) ? articles : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load news";
      console.error("News fetch error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          "https://api.currentsapi.services/v1/latest-news",
          {
            headers: {
              Authorization: "C_xj2AuN0TlcYPc4eGc4NKFk2yk4GYe77edJgo-OstigUAUB",
            },
          },
        );
        const json = await res.json();
        console.log("News API response:", json);
        if (cancelled) return;
        // Detect API-level error messages inside a 200 response
        if (json.error || json.status === "error") {
          throw new Error(
            json.error?.message || json.message || "API returned an error",
          );
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const articles =  json;
        setNews(articles);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Failed to load news";
          console.error("News fetch error:", msg);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex ">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-sm border border-slate-200">
          <button
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "moneyControl"
                ? "bg-white text-sky-600 shadow-md"
                : "text-slate-600 hover:text-sky-600"
            }`}
            onClick={() => setActiveTab("moneyControl")}
          >
            Money Control
          </button>
          <button
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "marketNews"
                ? "bg-white text-sky-600 shadow-md"
                : "text-slate-600 hover:text-sky-600"
            }`}
            onClick={() => setActiveTab("marketNews")}
          >
            Market News
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {activeTab === "moneyControl" && (
          <iframe
            src="https://www.moneycontrol.com/"
            className="w-full h-[700px]"
            title="Money Control"
          />
        )}

        {activeTab === "marketNews" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-800">
                Market News
              </h2>
              <button
                onClick={fetchNews}
                className="px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading news...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={fetchNews}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No news available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {news.map((item, i) => (
                  <NewsComponent
                    key={i}
                    data={item}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default News;
