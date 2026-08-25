# Banner Image Scraping — Async Architecture

## Problem

When loading finance news, each article URL needs to be visited on the backend to scrape the banner image (`og:image`, `twitter:image`, etc.). If we wait for all images to be scraped before showing anything, the user sees a blank screen for several seconds.

## Solution: Load-then-Enrich pattern

The cards render **immediately** with the API data. Image scraping runs in the background and images swap in dynamically as each URL finishes.

```
Time ──────────────────────────────────────────────►

  │  API returns articles
  │  │
  │  ▼
  │  setArticles(data)           ← Cards render NOW
  │  │                            (no images yet)
  │  │
  │  ▼
  │  fetchBanners(urls)          ← Background scraping starts
  │    │                           (non-blocking Promise)
  │    │
  │    ├── URL 1 done ──► setImageMap({url1: img1})  ──► Card 1 image appears
  │    ├── URL 2 done ──► setImageMap({url1, url2})   ──► Card 2 image appears
  │    └── URL 3 done ──► setImageMap({url1, url2, url3})
  │
  ▼
  All images loaded — no further re-renders
```

## How images are matched to the correct card

The article's `url` field is the common key that links the API data to the scraped result.

```
API response (Alpha Vantage / FinanceLayer)     Backend scrape result
─────────────────────────────                    ────────────────────
{                                                 {
  title: "Stock Market Up",                        url: "https://abc.com/stock-market-up",  ← same URL
  url: "https://abc.com/stock-market-up",   ──►    imageUrl: "https://abc.com/image.jpg",
  source: "abc.com",                                success: true
}                                                 }
```

**Step by step:**

1. Articles arrive from the API — each has a unique `url`
2. The article `url`s are extracted and sent to the backend for scraping
3. Backend returns `[{ url, imageUrl, success }]` — same `url` as the article
4. A **dictionary** is built: `imageMap = { "https://abc.com/stock-market-up": "https://abc.com/image.jpg" }`
5. In the render, each card looks up its image: `imageUrl={imageMap[article.url]}`
6. When scraping completes and `setImageMap(map)` runs, React re-renders only the cards whose `imageUrl` changed

### Code

```tsx
// 1. Build the lookup map using article URL as the key
const results = await fetchBanners(urls);
const map = {};
results.forEach(r => {
  if (r.success && r.imageUrl) map[r.url] = r.imageUrl;
});
setImageMap(map);

// 2. Render — each card looks up its image by article URL
{articles.map(article => (
  <NewsComponent
    key={article.url}
    imageUrl={imageMap[article.url]}   // ← match by article URL
    title={article.title}
    url={article.url}
  />
))}
```

The article URL is the **shared identifier** between the two systems — no extra IDs, no complex joins, just a simple dictionary lookup.

## How it works in code

```tsx
async function loadNews() {
  // 1. Fetch articles from finance API
  const res = await fetch("/api/FinanceNews");
  const body = await res.json();
  const items = body.feed ?? [];

  // 2. Render cards immediately (images will be empty)
  setArticles(items);

  // 3. Extract URLs for scraping
  const urls = items.map(a => a.url).filter(Boolean);

  // 4. Fire scraping in background — does NOT block the UI
  fetchBanners(urls)
    .then(results => {
      const map = {};
      results.forEach(r => {
        if (r.success && r.imageUrl) map[r.url] = r.imageUrl;
      });
      // 5. When ANY image arrives, React re-renders just that card
      setImageMap(map);
    })
    .catch(() => {});
}
```

## Data flow in the component

```
NewsComponent
  ├── receives: imageUrl={imageMap[item.url]}
  │
  ├── Initially: imageMap is {} → imageUrl is undefined
  │     └── Card shows skeleton pulse placeholder
  │
  └── After scraping: imageMap gets populated
        └── Card re-renders with real image (no refresh needed)
```

## Key benefits

| Before (blocking) | After (async) |
|---|---|
| User waits 3-5s for all scrapes | Cards render in <1s |
| Blank/spinner the whole time | Skeleton loaders visible immediately |
| One slow URL blocks everything | Images appear one-by-one as ready |
| Page reload required to retry | `setImageMap` triggers targeted re-render |

## Image lifecycle in NewsComponent

```tsx
const [imgLoaded, setImgLoaded] = useState(false);
const [imgError, setImgError] = useState(false);

// Scraped image arrives later — this handles it:
{!imgLoaded && !imgError && <div className="animate-pulse" />}

{imageUrl && !imgError ? (
  <img
    src={imageUrl}            ← swaps from undefined → real URL
    onLoad={() => setImgLoaded(true)}
    onError={() => setImgError(true)}
  />
) : (
  <FallbackIcon />            ← shown when no image yet
)}
```

React's reactivity handles the swap automatically — no window reload, no polling, no manual DOM updates.
