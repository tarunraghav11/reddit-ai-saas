import { logger } from "../utils/logger.js";

const CONFIG = {
  BASE_URL: "https://www.reddit.com/search.json",
  TIMEOUT_MS: parseInt(process.env.REDDIT_TIMEOUT_MS || "10000", 10),
  LIMIT: parseInt(process.env.REDDIT_LIMIT || "25", 10)
};

const fetchWithRetry = async (url, options, retries = 3, delayMs = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && (response.status === 429 || response.status >= 500)) {
        throw new Error(`Reddit API returned ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (err) {
      if (err.name === 'AbortError') throw err; // Don't retry timeouts here, let outer try catch it
      if (i === retries - 1) throw err;
      logger.warn(`[RedditService] Fetch failed (${err.message}), retrying in ${delayMs}ms...`);
      await new Promise(res => setTimeout(res, delayMs));
      delayMs *= 2; // exponential backoff
    }
  }
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
      response = await fetchWithRetry(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (!json?.data?.children || !Array.isArray(json.data.children)) {
      logger.warn("[RedditService] No posts in API response");
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

    logger.info(`[RedditService] Fetched ${posts.length} posts for: "${query}"`);
    return posts;

  } catch (err) {
    if (err.name === 'AbortError') {
      logger.error(`[RedditService] Request timeout after ${CONFIG.TIMEOUT_MS / 1000}s`);
      throw new Error("Reddit API request timeout");
    }
    logger.error(`[RedditService] Fetch error: ${err.message}`);
    throw err;
  }
};