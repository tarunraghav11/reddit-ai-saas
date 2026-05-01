import express from "express";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts, getCachedPosts } from "../services/redditRepository.js";
import { analyzePosts } from "../services/aiService.js";
import { isCacheFresh } from "../utils/cache.js";
import { rankPosts, filterTopPosts } from "../services/rankingService.js";
import { validateQuery } from "../utils/validators.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Health Check
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running"
  });
});

/**
 * Reddit Search with Cache
 */
router.get("/reddit/search", protect, async (req, res, next) => {
  try {
    let query;
    try {
      query = validateQuery(req.query.query);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Check cache
    const cachedPosts = await getCachedPosts(query);
    if (isCacheFresh(cachedPosts)) {
      // Analyze posts with AI
      const analyzedPosts = await analyzePosts(cachedPosts);
      const rankedPosts = rankPosts(analyzedPosts);
      const topPosts = filterTopPosts(rankedPosts, 5);
      return res.status(200).json({
        success: true,
        source: "cache",
        count: topPosts.length,
        data: topPosts
      });
    }

    // Fetch fresh data from Reddit
    const posts = await fetchRedditPosts(query);

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(200).json({
        success: true,
        source: "api",
        message: "No posts found",
        count: 0,
        data: []
      });
    }

    // Save to cache
    await savePosts(posts, query);

    // Analyze posts with AI (use in-memory posts to avoid redundant DB call)
    const analyzedPosts = await analyzePosts(posts);

    const rankedPosts = rankPosts(analyzedPosts);
    const topPosts = filterTopPosts(rankedPosts, 5);

    return res.status(200).json({
      success: true,
      source: "api",
      count: topPosts.length,
      data: topPosts
    });

  } catch (err) {
    console.error("[Routes] Search error:", err.message);
    next(err);
  }
});

export default router;