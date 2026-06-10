import { useEffect, useState } from "react";
import NewsComponent from "../../Component/News/NewsComponent";
import Masonry from "react-masonry-css";

function News() {
  console.log("News component rendered");
  let [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const breakpoints = {
    default: 4,
    1200: 3,
    768: 2,
    500: 1,
  };
  async function fetchNews() {
    await fetch("https://api.spaceflightnewsapi.net/v3/articles")
      .then((response: { json: () => any }) => response.json())
      .then((data) => setNews(data))
      .catch((error) => console.error("Error fetching news:", error))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNews();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <h1 className="text-white">News Component</h1>

      <Masonry
        breakpointCols={breakpoints}
        className="flex gap-4"
        columnClassName="space-y-4"
      >
        {news.map((data) => (
          <NewsComponent key={data.id} data={data} />
        ))}
      </Masonry>
    </>
  );
}
export default News;
