import express from "express";
import rateLimit from "express-rate-limit";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts, getCachedPosts } from "../services/redditRepository.js";
import { analyzePosts } from "../services/aiService.js";
import { isCacheFresh } from "../utils/cache.js";
import { rankPosts, filterTopPosts } from "../services/rankingService.js";
import { validateQuery, validateUrlsArray } from "../utils/validators.js";
import { protect } from "../middleware/authMiddleware.js";

import { validateUrl } from "../utils/urlValidator.js";
import { scrapeMultipleUrls } from "../services/urlService.js";
import { extractKeywordsFromText } from "../services/aiService.js";
import { logger } from "../utils/logger.js";
import { addDiscoverJob, discoverQueue } from "../jobs/discoverQueue.js";

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" },
});

const discoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many discover requests from this IP, please try again after 15 minutes" },
});

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
router.get("/reddit/search", protect, searchLimiter, async (req, res, next) => {
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
    logger.error(`[Routes] Search error: ${err.message}`);
    next(err);
  }
});


router.post("/leads/discover", protect, discoverLimiter, async (req, res, next) => {
  try {
    let urls;
    
    // 1. Validate input
    try {
      urls = validateUrlsArray(req.body.urls);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // 2. Add to background queue
    const jobId = await addDiscoverJob(urls);
    
    return res.status(202).json({
      success: true,
      message: "Lead discovery job started",
      jobId
    });

  } catch (err) {
    logger.error(`[Discover Route] Error: ${err.message}`);
    next(err);
  }
});

/**
 * Polling Route for Background Job Status
 */
router.get("/leads/discover/:jobId/status", protect, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await discoverQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const state = await job.getState();
    const progress = job.progress;
    
    if (state === 'completed') {
      return res.status(200).json({
        success: true,
        status: 'completed',
        progress: 100,
        result: job.returnvalue
      });
    }

    if (state === 'failed') {
      return res.status(500).json({
        success: false,
        status: 'failed',
        message: job.failedReason || "Job failed during processing"
      });
    }

    // Active, waiting, or delayed
    return res.status(200).json({
      success: true,
      status: state,
      progress: progress?.step || 0,
      message: progress?.message || "Waiting in queue..."
    });

  } catch (err) {
    logger.error(`[Job Status Route] Error: ${err.message}`);
    next(err);
  }
});

export default router;

