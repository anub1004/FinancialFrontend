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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const body = await res.json();
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Finance News</h2>
        <button
          onClick={() => { setCurrentPage(1); fetchFinanceNews(1); }}
          className="px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 dark:text-violet-400 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors"
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
              <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-750" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => fetchFinanceNews(currentPage)}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
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
            <div className="flex justify-center items-center gap-2 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Prev
              </button>

              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border transition-all duration-200 ${
                    currentPage === pageNum
                      ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Today News</h2>
        <button
          onClick={() => { setCurrentPage(1); fetchTodayNews(1); }}
          className="px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 dark:text-violet-400 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors"
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
              <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-750" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => fetchTodayNews(currentPage)}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
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
            <div className="flex justify-center items-center gap-2 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Prev
              </button>

              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border transition-all duration-200 ${
                    currentPage === pageNum
                      ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
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
              activeTab === "FinanceNews"
                ? "bg-white text-sky-600 shadow-md"
                : "text-slate-600 hover:text-sky-600"
            }`}
            onClick={() => setActiveTab("FinanceNews")}
          >
            Finance News
          </button>

           <button
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "TodayNews"
                ? "bg-white text-sky-600 shadow-md"
                : "text-slate-600 hover:text-sky-600"
            }`}
            onClick={() => setActiveTab("TodayNews")}
          >
            Today News
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" >
        {activeTab === "moneyControl" && (
          <iframe
            src="https://www.moneycontrol.com/"
            className="w-full h-[700px]"
            title="Money Control"
          />
        )}
        {activeTab === "FinanceNews" && <FinanceNewsSection />}
        {activeTab === "TodayNews" && <TodayNewsSection />}
      </div>
    </div>
  );
}

export default News;
