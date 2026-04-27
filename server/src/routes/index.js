import express from "express";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts } from "../services/redditRepository.js";


const router = express.Router();

/**
 * Health Check
 */
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

/**
 * Reddit Search Route
 */
router.get("/reddit/search", async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }
    const posts = await fetchRedditPosts(query);

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No posts found for the given query"
      });
    }

    await savePosts(posts, query);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });

  } catch (err) {
    next(err);
  }
});

export default router;