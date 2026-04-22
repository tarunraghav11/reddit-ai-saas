import express from "express";
import { supabase } from "../config/supabase.js";
import { fetchRedditPosts } from "../services/redditService.js";

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
        message: "Query parameter is required"
      });
    }

    const posts = await fetchRedditPosts(query);

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