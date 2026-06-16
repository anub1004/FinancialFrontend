import { useEffect, useState } from "react";

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
  const [showNews, setShowNews] = useState(true);
  const [showMarketNews, setShowMarketNews] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(NewsApiConfig.url);
      const json = await res.json();
      setNews(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading news...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={fetchNews}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  if (news.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No news available.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
  className={`px-5 py-2 font-medium rounded-lg transition-all duration-200 cursor-pointer ${
    showNews
      ? "bg-sky-500 text-white shadow-lg"
      : "bg-transparent text-sky-500 border border-sky-500"
  }`}
  onClick={() => {
    setShowNews((prev) => !prev);
    setShowMarketNews(false);
  }}
>
  Money Control
</button>
        <button
          
          className={`px-5 py-2 font-medium rounded-lg transition-all duration-200 cursor-pointer ${
    showMarketNews
      ? "bg-sky-500 text-white shadow-lg"
      : "bg-transparent text-sky-500 border border-sky-500"
  }`}
          onClick={() => {  setShowNews((prev) => !prev);
  setShowMarketNews((prev) => !prev);
}}
        >
          Market News
        </button>
      </div>

    {showNews &&  <iframe
        src="https://www.moneycontrol.com/"
        width="100%"
        height="600"
        frameBorder="0"
      ></iframe>}
      {showMarketNews&& <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> News </div>}
      
    </div>
  );
}

export default News;
