import { supabase } from "../config/supabase.js";

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

    console.log(`[Repository] Retrieved ${data?.length || 0} cached posts for: "${normalized}"`);
    return data || [];

  } catch (err) {
    console.error("[Repository] Fetch error:", err.message);
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
      console.warn("[Repository] No posts to save");
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

    // Delete old entries for this query to ensure fresh batch
    const { error: deleteErr } = await supabase
      .from("reddit_posts")
      .delete()
      .eq("query", normalized);

    if (deleteErr) {
      console.warn("[Repository] Delete old entries warning:", deleteErr.message);
    }

    // Insert new posts
    const { error: insertErr } = await supabase
      .from("reddit_posts")
      .insert(payload);

    if (insertErr) throw insertErr;

    console.log(`[Repository] Saved ${payload.length} posts for: "${normalized}" at ${new Date(fetchedAt).toISOString()}`);

  } catch (err) {
    console.error("[Repository] Save error:", err.message);
    throw err;
  }
};