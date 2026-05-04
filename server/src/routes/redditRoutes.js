import express from "express";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts, getCachedPosts } from "../services/redditRepository.js";
import { analyzePosts } from "../services/aiService.js";
import { isCacheFresh } from "../utils/cache.js";
import { rankPosts, filterTopPosts } from "../services/rankingService.js";
import { validateQuery } from "../utils/validators.js";
import { protect } from "../middleware/authMiddleware.js";

import { validateUrl } from "../utils/urlValidator.js";
import { scrapeMultipleUrls } from "../services/urlService.js";
import { extractKeywordsFromText } from "../services/aiService.js";

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


router.post("/leads/discover", protect, async (req, res, next) => {
  try {
    const { urls } = req.body;

    // 1. Validate input
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "URLs must be a non-empty array"
      });
    }

    if (urls.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 URLs allowed"
      });
    }

    // 2. Validate URLs (parallel)
    let validUrls;
    try {
      validUrls = await Promise.all(urls.map(validateUrl));
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // 3. Scrape content
    let contents;
    try {
      contents = await scrapeMultipleUrls(validUrls);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to scrape URLs"
      });
    }

    const mergedContent = contents.join(" ");

    // 4. Extract keywords (AI)
    const keywordData = await extractKeywordsFromText(mergedContent);

    const keywords = keywordData.keywords || [];

    if (keywords.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No keywords extracted",
        data: []
      });
    }

    // 5. Fetch Reddit posts (parallel)
    const redditResults = await Promise.all(
      keywords.map(async (keyword) => {
        try {
          return await fetchRedditPosts(keyword);
        } catch {
          return [];
        }
      })
    );

    let posts = redditResults.flat();

    // 6. Deduplicate posts
    const uniqueMap = new Map();
    posts.forEach(post => {
      if (!uniqueMap.has(post.id)) {
        uniqueMap.set(post.id, post);
      }
    });

    posts = Array.from(uniqueMap.values());

    // 7. Limit posts (IMPORTANT for cost)
    posts = posts.slice(0, 15);

    // 8. Analyze intent (AI)
    const analyzedPosts = await analyzePosts(posts);

    // 9. Rank + filter
    const rankedPosts = rankPosts(analyzedPosts);
    const topPosts = filterTopPosts(rankedPosts, 10);

    return res.status(200).json({
      success: true,
      keywords,
      category: keywordData.category,
      painPoints: keywordData.painPoints,
      count: topPosts.length,
      data: topPosts
    });

  } catch (err) {
    console.error("[Discover Route] Error:", err.message);
    next(err);
  }
});

export default router;

