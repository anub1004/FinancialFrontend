import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface NewsComponentProps {
  title?: string;
  description?: string;
  url: string;
  imageUrl?: string;
  sourceName?: string;
  author?: string;
  publishedAt?: string;
}

function NewsComponent({
  title,
  description,
  url,
  imageUrl,
  sourceName,
  author,
  publishedAt,
}: NewsComponentProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const timeAgo = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null;

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/40 overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative overflow-hidden aspect-[16/9] bg-indigo-50 dark:bg-indigo-950/30">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/40 animate-pulse" />
          )}
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={title || ""}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-indigo-300 dark:text-indigo-700">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </a>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
          {author && (
            <>
              <span className="truncate max-w-[120px]">{author}</span>
              <span className="w-1 h-1 rounded-full bg-indigo-300 dark:bg-indigo-700 shrink-0" />
            </>
          )}
          {sourceName && (
            <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[140px]">
              {sourceName}
            </span>
          )}
          {timeAgo && (
            <>
              <span className="w-1 h-1 rounded-full bg-indigo-300 dark:bg-indigo-700 shrink-0" />
              <span className="shrink-0">{timeAgo}</span>
            </>
          )}
        </div>

        {title && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
          </a>
        )}

        {description && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-500/20 self-start"
        >
          Read More
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </article>
  );
}

export default NewsComponent;
