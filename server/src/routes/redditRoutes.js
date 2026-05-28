import express from "express";
import rateLimit from "express-rate-limit";
import { fetchRedditPosts } from "../services/redditService.js";
import {
  savePosts,
  getCachedPosts,
  getAnalyzedPostsByIds,
  saveLeadSession,
} from "../services/redditRepository.js";
import { analyzePosts, generateOutreach } from "../services/aiService.js";
import { isCacheFresh } from "../utils/cache.js";
import { rankPosts, filterTopPosts } from "../services/rankingService.js";
import { validateQuery, validateUrlsArray } from "../utils/validators.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkQuota } from "../middleware/quotaMiddleware.js";
import { validateUrl } from "../utils/urlValidator.js";
import { scrapeMultipleUrls } from "../services/urlService.js";
import { extractKeywordsFromText } from "../services/aiService.js";
import { logger } from "../utils/logger.js";
import { addDiscoverJob, discoverQueue } from "../jobs/discoverQueue.js";

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

const discoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message:
      "Too many discover requests from this IP, please try again after 15 minutes",
  },
});

/**
 * Health Check
 */
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

/**
 * Reddit Search with Cache + AI Skip Optimization
 *
 * Flow:
 *  1. Check DB cache → if fresh, use cached posts
 *  2. For posts without AI data → send only those to AI (cost optimization)
 *  3. Merge pre-analyzed + freshly analyzed posts
 *  4. Rank, filter, save, and return top results
 *  5. Persist session for the authenticated user
 */
router.get("/reddit/search", protect, searchLimiter, checkQuota("search"), async (req, res, next) => {
  try {
    let query;
    try {
      query = validateQuery(req.query.query);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const userId = req.user?.id;
    let sourcePosts = [];
    let cacheSource = "api";

    // ── Step 1: Check DB cache ──────────────────────────────────────────
    const cachedPosts = await getCachedPosts(query);
    const cacheHit = isCacheFresh(cachedPosts);

    if (cacheHit) {
      sourcePosts = cachedPosts;
      cacheSource = "api";
      logger.info(`[Search] Cache HIT for "${query}" — ${sourcePosts.length} posts`);
    } else {
      // ── Step 2: Fetch fresh posts from Reddit ───────────────────────
      const freshPosts = await fetchRedditPosts(query);

      if (!Array.isArray(freshPosts) || freshPosts.length === 0) {
        return res.status(200).json({
          success: true,
          source: "api",
          message: "No posts found",
          count: 0,
          data: [],
        });
      }

      // Save raw posts first (no AI data yet) to avoid losing them
      await savePosts(freshPosts, query, userId);
      sourcePosts = freshPosts;
      cacheSource = "api";
    }

    // ── Step 3: AI Skip Optimization ───────────────────────────────────
    // Check which of these posts already have AI analysis stored in DB
    const allIds = sourcePosts.map((p) => p.id);
    const preAnalyzed = await getAnalyzedPostsByIds(allIds);
    const preAnalyzedMap = new Map(preAnalyzed.map((p) => [p.id, p]));

    const needsAnalysis = sourcePosts.filter((p) => !preAnalyzedMap.has(p.id));

    logger.info(
      `[Search] AI optimization: ${preAnalyzed.length} pre-analyzed, ${needsAnalysis.length} need AI`
    );

    // ── Step 4: Analyze only un-analyzed posts ──────────────────────────
    let freshlyAnalyzed = [];
    if (needsAnalysis.length > 0) {
      freshlyAnalyzed = await analyzePosts(needsAnalysis);

      // Persist AI results back to DB so next search skips them
      await savePosts(freshlyAnalyzed, query, userId);
    }

    // ── Step 5: Merge all posts (pre-analyzed + freshly analyzed) ────────
    const mergedPosts = sourcePosts.map((p) => {
      // Prefer freshly analyzed (has finalScore + opportunity from ranking)
      const fresh = freshlyAnalyzed.find((f) => f.id === p.id);
      if (fresh) return fresh;
      // Fall back to pre-analyzed DB record
      return preAnalyzedMap.get(p.id) || p;
    });

    // ── Step 6: Rank and filter ─────────────────────────────────────────
    const rankedPosts = rankPosts(mergedPosts);
    const topPosts = filterTopPosts(rankedPosts, 5);

    // ── Step 7: Save lead session asynchronously (non-blocking) ─────────
    saveLeadSession(userId, query, topPosts, {
      source: cacheSource,
      category: null,
      keywords: [],
      painPoints: [],
    }).catch((e) =>
      logger.error(`[Search] Non-blocking saveLeadSession failed: ${e.message}`)
    );

    return res.status(200).json({
      success: true,
      source: cacheSource,
      count: topPosts.length,
      data: topPosts,
    });
  } catch (err) {
    logger.error(`[Routes] Search error: ${err.message}`);
    next(err);
  }
});

/**
 * Discover leads from URLs (queues a background BullMQ job)
 */
router.post(
  "/leads/discover",
  protect,
  discoverLimiter,
  checkQuota("discover"),
  async (req, res, next) => {
    try {
      let urls;
      try {
        urls = validateUrlsArray(req.body.urls);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const jobId = await addDiscoverJob(urls, req.user?.id);

      return res.status(202).json({
        success: true,
        message: "Lead discovery job started",
        jobId,
      });
    } catch (err) {
      logger.error(`[Discover Route] Error: ${err.message}`);
      next(err);
    }
  }
);

/**
 * Polling Route for Background Job Status
 */
router.get(
  "/leads/discover/:jobId/status",
  protect,
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const job = await discoverQueue.getJob(jobId);

      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }

      const state = await job.getState();
      const progress = job.progress;

      if (state === "completed") {
        return res.status(200).json({
          success: true,
          status: "completed",
          progress: 100,
          result: job.returnvalue,
        });
      }

      if (state === "failed") {
        return res.status(500).json({
          success: false,
          status: "failed",
          message: job.failedReason || "Job failed during processing",
        });
      }

      return res.status(200).json({
        success: true,
        status: state,
        progress: progress?.step || 0,
        message: progress?.message || "Waiting in queue...",
      });
    } catch (err) {
      logger.error(`[Job Status Route] Error: ${err.message}`);
      next(err);
    }
  }
);

/**
 * AI Outreach — generates 2 personalized Reddit reply drafts
 */
const outreachLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many outreach requests. Wait 15 minutes." },
});

router.post("/leads/outreach", protect, outreachLimiter, checkQuota("outreach"), async (req, res, next) => {
  try {
    const { title, pain, subreddit, reason } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "Post title is required" });

    const replies = await generateOutreach({
      title: title.trim(),
      pain: pain?.trim() || null,
      subreddit: subreddit?.trim() || null,
      reason: reason?.trim() || null,
    });

    return res.status(200).json({ success: true, replies });
  } catch (err) {
    if (err.message?.includes("429") || err.message?.includes("rate")) {
      return res.status(429).json({ success: false, message: "AI rate-limited. Try again in a minute." });
    }
    logger.error(`[Outreach] Error: ${err.message}`);
    next(err);
  }
});

export default router;
