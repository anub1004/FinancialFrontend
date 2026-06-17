import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface NewsArticle {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  source?: { name?: string; id?: string } | string;
  publishedAt?: string;
  author?: string;
}

function NewsComponent({ data }: { data: NewsArticle }) {
  const [imgError, setImgError] = useState(false);

  console.log("NewsComponent data:", data);

  const sourceName = source?.name || source || "Unknown";
  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : "";

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative overflow-hidden aspect-[16/9] bg-gray-100 dark:bg-gray-700">
          {urlToImage && !imgError ? (
            <img
              src={urlToImage}
              alt={title || ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}
        </div>
      </a>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          {author && (
            <>
              <span className="truncate">{author}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
            </>
          )}
          <span className="font-medium text-violet-600 dark:text-violet-400 truncate">{sourceName}</span>
          {timeAgo && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
              <span className="shrink-0">{timeAgo}</span>
            </>
          )}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="block flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {title}
          </h3>
        </a>
        {description && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}

export default NewsComponent;
