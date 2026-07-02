import { useState } from "react";
import { fetchBanners, type BannerResult } from "../../lib/blogBannerApi";



function BlogBanners() {
  const [urls, setUrls] = useState(""); // Multiline input for URLs
  const [results, setResults] = useState<BannerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urlList.length === 0) {
      setError("Enter at least one URL");
      return;
    }
    if (urlList.length > 50) {
      setError("Maximum 50 URLs allowed");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchBanners(urlList);
      setResults(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch banners";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Blog URLs (one per line)
        </label>
        <textarea
          className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          placeholder="https://example.com/blog&#10;https://another.com/post"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500">
            Enter up to 50 blog post URLs to fetch their banner images
          </p>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Fetching..." : "Fetch Banners"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((item, idx) => (
            <article
              key={idx}
              className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative overflow-hidden aspect-[16/9] bg-slate-100">
                  {item.success && item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </a>
              <div className="p-4 flex-1 flex flex-col">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block flex-1"
                >
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-3 group-hover:text-violet-600 transition-colors">
                    {item.title || item.url}
                  </h3>
                </a>
                {item.description && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
                {!item.success && (
                  <p className="mt-2 text-xs text-red-400 line-clamp-1">
                    {item.error || "No banner found"}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogBanners;
