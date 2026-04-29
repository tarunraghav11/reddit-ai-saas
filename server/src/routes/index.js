import express from "express";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts, getCachedPosts } from "../services/redditRepository.js";
import { analyzePosts } from "../services/aiService.js";
import { isCacheFresh } from "../utils/cache.js";

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
router.get("/reddit/search", async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a non-empty string"
      });
    }

    // Check cache
    const cachedPosts = await getCachedPosts(query);
    if (isCacheFresh(cachedPosts)) {
      // Analyze posts with AI
      const analyzedPosts = await analyzePosts(cachedPosts);
      return res.status(200).json({
        success: true,
        source: "cache",
        count: analyzedPosts.length,
        data: analyzedPosts
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

    // Fetch from DB to ensure response reflects actual persisted state (source of truth)
    const savedPosts = await getCachedPosts(query);

    // Analyze posts with AI
    const analyzedPosts = await analyzePosts(savedPosts);

    return res.status(200).json({
      success: true,
      source: "api",
      count: analyzedPosts.length,
      data: analyzedPosts
    });

  } catch (err) {
    console.error("[Routes] Search error:", err.message);
    next(err);
  }
});

export default router;