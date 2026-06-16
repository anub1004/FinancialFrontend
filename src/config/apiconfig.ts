let Api_Base_Url = "https://localhost:7085/";

// Configure your news API endpoint here
// Expected response format: array of objects with { title, description, url, urlToImage, source: { name }, publishedAt, author }
export const NewsApiConfig = {
  url: "https://api.marketaux.com/v1/news/all?symbols=TSLA%2CAMZN%2CMSFT&filter_entities=true&language=en&api_token=X4b9JvlM9slwIIAD33Eb6mudFO4ycJLvyJ1LTsVA",
};
export const ApiConfig = {
  Api_Base_Url,
};
