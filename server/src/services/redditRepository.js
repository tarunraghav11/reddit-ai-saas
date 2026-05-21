import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const normalizeQuery = (query) => {
  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }
  return query.toLowerCase().trim();
};

// ─────────────────────────────────────────────
// POST CACHE
// ─────────────────────────────────────────────

/**
 * Get cached posts for a query
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

    logger.info(
      `[Repository] Retrieved ${data?.length || 0} cached posts for: "${normalized}"`
    );
    return data || [];
  } catch (err) {
    logger.error(`[Repository] getCachedPosts error: ${err.message}`);
    throw err;
  }
};

/**
 * Save posts to DB, upserting to avoid PK conflicts.
 * Only posts with AI data will carry intent/score/pain/reason.
 */
export const savePosts = async (posts, query, userId = null) => {
  try {
    if (!Array.isArray(posts) || posts.length === 0) {
      logger.warn("[Repository] No posts to save");
      return;
    }

    const normalized = normalizeQuery(query);
    const fetchedAt = Date.now();

    const payload = posts.map((post) => ({
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      upvotes: post.upvotes,
      comments: post.comments,
      url: post.url,
      query: normalized,
      created_at: post.created_at || post.createdAt,
      fetched_at: fetchedAt,
      user_id: userId,
      intent: post.intent || null,
      score: post.score || null,
      pain: post.pain || null,
      reason: post.reason || null,
    }));

    const { error } = await supabase
      .from("reddit_posts")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    logger.info(
      `[Repository] Saved ${payload.length} posts for: "${normalized}" (User: ${userId || "Anonymous"})`
    );
  } catch (err) {
    logger.error(`[Repository] savePosts error: ${err.message}`);
    throw err;
  }
};

/**
 * Fetch posts by Reddit IDs that already have AI analysis stored.
 * Used to skip re-analysis and save API calls.
 */
export const getAnalyzedPostsByIds = async (ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return [];

    const { data, error } = await supabase
      .from("reddit_posts")
      .select("*")
      .in("id", ids)
      .not("intent", "is", null);

    if (error) throw error;

    logger.info(
      `[Repository] Found ${data?.length || 0}/${ids.length} pre-analyzed posts (AI skipped for these)`
    );
    return data || [];
  } catch (err) {
    logger.error(`[Repository] getAnalyzedPostsByIds error: ${err.message}`);
    return [];
  }
};

// ─────────────────────────────────────────────
// LEAD SESSIONS
// ─────────────────────────────────────────────

/**
 * Create a new lead session and link posts to it.
 * Returns the created session's ID.
 *
 * @param {string} userId - Supabase user ID
 * @param {string} query  - Search query / label
 * @param {Array}  posts  - Fully analyzed + ranked post objects
 * @param {object} meta   - { source, category, keywords, painPoints }
 */
export const saveLeadSession = async (userId, query, posts, meta = {}) => {
  try {
    if (!userId) {
      logger.warn("[Repository] saveLeadSession called without userId — skipping");
      return null;
    }

    const normalized = normalizeQuery(query);

    // 1. Insert session record
    const { data: session, error: sessionErr } = await supabase
      .from("lead_sessions")
      .insert({
        user_id: userId,
        query: normalized,
        source: meta.source || "search",
        category: meta.category || null,
        keywords: meta.keywords || [],
        pain_points: meta.painPoints || [],
        lead_count: posts.length,
      })
      .select("id")
      .single();

    if (sessionErr) throw sessionErr;

    const sessionId = session.id;

    // 2. Link posts to session (junction table)
    if (posts.length > 0) {
      const junctionRows = posts.map((p) => ({
        session_id: sessionId,
        post_id: p.id,
      }));

      const { error: linkErr } = await supabase
        .from("session_leads")
        .insert(junctionRows);

      if (linkErr) throw linkErr;
    }

    logger.info(
      `[Repository] Saved session "${sessionId}" with ${posts.length} leads for user ${userId}`
    );

    return sessionId;
  } catch (err) {
    // Non-fatal: session save failing shouldn't break the search response
    logger.error(`[Repository] saveLeadSession error: ${err.message}`);
    return null;
  }
};

/**
 * Fetch all lead sessions for a user (newest first, paginated).
 *
 * @param {string} userId
 * @param {number} page  - 0-indexed page
 * @param {number} limit - Results per page (default 25)
 */
export const getUserLeadSessions = async (userId, page = 0, limit = 25) => {
  try {
    if (!userId) return [];

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("lead_sessions")
      .select("id, query, source, category, keywords, pain_points, lead_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    logger.info(
      `[Repository] Retrieved ${data?.length || 0} sessions for user ${userId}`
    );
    return data || [];
  } catch (err) {
    logger.error(`[Repository] getUserLeadSessions error: ${err.message}`);
    return [];
  }
};

/**
 * Fetch all leads for a specific session (joins session_leads → reddit_posts).
 *
 * @param {string} sessionId
 * @param {string} userId    - Validated against session owner for security
 */
export const getSessionLeads = async (sessionId, userId) => {
  try {
    if (!sessionId || !userId) return null;

    // Verify ownership
    const { data: session, error: sessErr } = await supabase
      .from("lead_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessErr || !session) {
      logger.warn(`[Repository] Session ${sessionId} not found or unauthorized`);
      return null;
    }

    // Fetch linked posts via junction table
    const { data: links, error: linkErr } = await supabase
      .from("session_leads")
      .select("post_id")
      .eq("session_id", sessionId);

    if (linkErr) throw linkErr;

    const postIds = (links || []).map((l) => l.post_id);

    if (postIds.length === 0) {
      return { session, posts: [] };
    }

    const { data: posts, error: postsErr } = await supabase
      .from("reddit_posts")
      .select("*")
      .in("id", postIds);

    if (postsErr) throw postsErr;

    return { session, posts: posts || [] };
  } catch (err) {
    logger.error(`[Repository] getSessionLeads error: ${err.message}`);
    throw err;
  }
};

/**
 * Delete a lead session (cascade deletes session_leads via FK).
 *
 * @param {string} sessionId
 * @param {string} userId - Must match owner
 */
export const deleteLeadSession = async (sessionId, userId) => {
  try {
    const { error } = await supabase
      .from("lead_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) throw error;

    logger.info(`[Repository] Deleted session ${sessionId} for user ${userId}`);
    return true;
  } catch (err) {
    logger.error(`[Repository] deleteLeadSession error: ${err.message}`);
    throw err;
  }
};