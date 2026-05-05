import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
/**
 * Normalize query for consistent DB lookups
 * @param {string} query - Raw query string
 * @returns {string} Normalized query (lowercase, trimmed)
 */
const normalizeQuery = (query) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }
  return query.toLowerCase().trim();
};

/**
 * Get cached posts for a query
 * @param {string} query - Search query
 * @returns {Promise<Array>} Cached posts array
 */
export const getCachedPosts = async (query) => {
  try {
    const normalized = normalizeQuery(query);

    const { data, error } = await supabase
      .from("reddit_posts")
      .select("*")
      .eq("query", normalized)
      .order("fetched_at", { ascending: false });

    if (error) throw error;

    logger.info(`[Repository] Retrieved ${data?.length || 0} cached posts for: "${normalized}"`);
    return data || [];

  } catch (err) {
    logger.error(`[Repository] Fetch error: ${err.message}`);
    throw err;
  }
};

/**
 * Save posts to DB, replacing old entries for the same query with fresh batch
 * @param {Array} posts - Posts to save
 * @param {string} query - Search query
 */
export const savePosts = async (posts, query) => {
  try {
    if (!Array.isArray(posts) || posts.length === 0) {
      logger.warn("[Repository] No posts to save");
      return;
    }

    const normalized = normalizeQuery(query);
    const fetchedAt = Date.now(); // Unix timestamp in ms

    const payload = posts.map((post) => ({
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      upvotes: post.upvotes,
      comments: post.comments,
      url: post.url,
      query: normalized,
      created_at: post.createdAt,
      fetched_at: fetchedAt
    }));

    // Upsert posts to avoid duplicate primary-key conflicts when the same
    // reddit post can appear under different queries. This updates existing
    // rows (by `id`) or inserts new ones.
    const { error: upsertErr } = await supabase
      .from("reddit_posts")
      .upsert(payload, { onConflict: "id" });

    if (upsertErr) throw upsertErr;

    logger.info(`[Repository] Saved ${payload.length} posts for: "${normalized}" at ${new Date(fetchedAt).toISOString()}`);

  } catch (err) {
    logger.error(`[Repository] Save error: ${err.message}`);
    throw err;
  }
};