const CONFIG = {
  BASE_URL: "https://www.reddit.com/search.json",
  TIMEOUT_MS: parseInt(process.env.REDDIT_TIMEOUT_MS || "10000", 10),
  LIMIT: parseInt(process.env.REDDIT_LIMIT || "10", 10)
};

/**
 * Fetch posts from Reddit API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Normalized posts array
 * @throws {Error} If fetch fails
 */
export const fetchRedditPosts = async (query) => {
  try {
    if (!query || typeof query !== 'string' || query.trim() === "") {
      throw new Error("Query must be a non-empty string");
    }

    const url = `${CONFIG.BASE_URL}?q=${encodeURIComponent(query)}&limit=${CONFIG.LIMIT}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (!json?.data?.children || !Array.isArray(json.data.children)) {
      console.warn("[RedditService] No posts in API response");
      return [];
    }

    const posts = json.data.children.map(({ data: post }) => ({
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      upvotes: post.ups,
      comments: post.num_comments,
      url: `https://reddit.com${post.permalink}`,
      createdAt: new Date(post.created_utc * 1000)
    }));

    console.log(`[RedditService] Fetched ${posts.length} posts for: "${query}"`);
    return posts;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[RedditService] Request timeout after ${CONFIG.TIMEOUT_MS / 1000}s`);
      throw new Error("Reddit API request timeout");
    }
    console.error("[RedditService] Fetch error:", err.message);
    throw err;
  }
};