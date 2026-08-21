import { useCallback, useEffect, useState } from "react";
import NewsComponent from "../../Component/News/NewsComponent";
import { DatabaseFinanceNewsConfig, DatabaseTodayNewsConfig } from "../../config/apiconfig";
interface Article {
  title?: string;
  description?: string;
  url: string;
  urlToImage?: string;
  author?: string;
  source?: { name?: string };
  publishedAt?: string;
}
function FinanceNewsSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;
  const fetchFinanceNews = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError("");
    try {
      const url = `${DatabaseFinanceNewsConfig.url}${DatabaseFinanceNewsConfig.url.includes("?") ? "&" : "?"}page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url);
      console.log(res); // Debugging line
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const body = await res.json();
      console.log("Finance News Response:", body); // Debugging line
      const raw: any[] = body?.items ?? [];
      if (raw.length === 0 && page === 1) throw new Error("No articles found");

      if (body?.totalItems != null) {
        setTotalCount(body.totalItems);
      }

      const list: Article[] = raw.map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        source: typeof item.source === "string"
          ? { name: item.source }
          : (item.source?.name ? { name: item.source.name } : undefined),
        publishedAt: item.published_at ?? item.publishedAt,
        urlToImage: item.imageUrl,
      }));
      setArticles(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load finance news";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchFinanceNews(currentPage);
  }, [fetchFinanceNews, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const goToPage = (page: number) => {
    setCurrentPage(page);
    const container = document.getElementById("main-content");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  };

  const maxVisible = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-200">Finance News</h2>
        <button
          onClick={() => { setCurrentPage(1); fetchFinanceNews(1); }}
          className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 dark:text-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse"
            >
              <div className="aspect-[16/9] bg-indigo-100 dark:bg-indigo-950/40" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-indigo-100 dark:bg-indigo-900/40 rounded w-1/3" />
                <div className="h-4 bg-indigo-100 dark:bg-indigo-900/40 rounded w-full" />
                <div className="h-4 bg-indigo-100 dark:bg-indigo-900/40 rounded w-2/3" />
                <div className="h-3 bg-indigo-100 dark:bg-indigo-900/40 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => fetchFinanceNews(currentPage)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No news available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((article, idx) => (
              <NewsComponent
                key={article.url + idx}
                title={article.title}
                description={article.description}
                url={article.url}
                imageUrl={article.urlToImage}
                sourceName={article.source?.name}
                publishedAt={article.publishedAt}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 border-t border-indigo-100 dark:border-indigo-900/40">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Prev
              </button>

              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border transition-all duration-200 ${currentPage === pageNum
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-md shadow-indigo-500/25"
                      : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                    }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TodayNewsSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  const fetchTodayNews = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError("");
    try {
      const url = `${DatabaseTodayNewsConfig.url}${DatabaseTodayNewsConfig.url.includes("?") ? "&" : "?"}page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const body = await res.json();
      console.log("Today News Response:", body); // Debugging line
      const raw: any[] = body?.items ?? [];
      if (raw.length === 0 && page === 1) throw new Error("No articles found");

      if (body?.totalItems != null) {
        setTotalCount(body.totalItems);
      }

      const list: Article[] = raw.map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        source: typeof item.source === "string"
          ? { name: item.source }
          : (item.source?.name ? { name: item.source.name } : undefined),
        publishedAt: item.published_at ?? item.publishedAt,
        urlToImage: item.imageUrl,
      }));
      setArticles(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load today's news";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchTodayNews(currentPage);
  }, [fetchTodayNews, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const goToPage = (page: number) => {
    setCurrentPage(page);
    const container = document.getElementById("main-content");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  };

  const maxVisible = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-200">Today's News</h2>
        <button
          onClick={() => { setCurrentPage(1); fetchTodayNews(1); }}
          className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 dark:text-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse"
            >
              <div className="aspect-[16/9] bg-indigo-100 dark:bg-indigo-950/40" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-indigo-100 dark:bg-indigo-900/40 rounded w-1/3" />
                <div className="h-4 bg-indigo-100 dark:bg-indigo-900/40 rounded w-full" />
                <div className="h-4 bg-indigo-100 dark:bg-indigo-900/40 rounded w-2/3" />
                <div className="h-3 bg-indigo-100 dark:bg-indigo-900/40 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => fetchTodayNews(currentPage)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No news available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((article, idx) => (
              <NewsComponent
                key={article.url + idx}
                title={article.title}
                description={article.description}
                url={article.url}
                imageUrl={article.urlToImage}
                sourceName={article.source?.name}
                publishedAt={article.publishedAt}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 border-t border-indigo-100 dark:border-indigo-900/40">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Prev
              </button>

              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border transition-all duration-200 ${currentPage === pageNum
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-md shadow-indigo-500/25"
                      : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                    }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function News() {
  const [activeTab, setActiveTab] = useState("moneyControl");
  return (
    <div className="space-y-6 ">
      <div className="flex">
        <div className="inline-flex rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-1.5 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
          <button
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === "moneyControl"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25"
                : "text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30"
              }`}
            onClick={() => setActiveTab("moneyControl")}
          >
            Money Control
          </button>

          <button
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === "FinanceNews"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25"
                : "text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30"
              }`}
            onClick={() => setActiveTab("FinanceNews")}
          >
            Finance News
          </button>

          <button
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === "TodayNews"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25"
                : "text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30"
              }`}
            onClick={() => setActiveTab("TodayNews")}
          >
            Today News
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-800/50 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" >
        {activeTab === "moneyControl" && (
          <iframe
            src="https://www.moneycontrol.com/"
            className="w-full h-[700px]"
            title="Money Control"
          />
        )}
        <div style={{ display: activeTab === "FinanceNews" ? "block" : "none" }}>
          <FinanceNewsSection />
        </div>
        <div style={{ display: activeTab === "TodayNews" ? "block" : "none" }}>
          <TodayNewsSection />
        </div>
      </div>
    </div>
  );
}

export default News;
