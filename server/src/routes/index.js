import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

/**
 * Health Check Route
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

/**
 * Test DB Connection
 */
router.get("/test-db", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("test")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

export default router;