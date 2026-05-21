import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserLeadSessions,
  getSessionLeads,
  deleteLeadSession,
} from "../services/redditRepository.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * GET /leads/history
 * Returns paginated lead sessions for the authenticated user.
 */
router.get("/leads/history", protect, async (req, res, next) => {
  try {
    const page = Math.max(0, parseInt(req.query.page || "0", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "25", 10)));

    const sessions = await getUserLeadSessions(req.user.id, page, limit);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      page,
      data: sessions,
    });
  } catch (err) {
    logger.error(`[History Route] GET /leads/history error: ${err.message}`);
    next(err);
  }
});

/**
 * GET /leads/history/:sessionId
 * Returns all posts for a specific saved session.
 */
router.get("/leads/history/:sessionId", protect, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const result = await getSessionLeads(sessionId, req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Session not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      session: result.session,
      count: result.posts.length,
      data: result.posts,
    });
  } catch (err) {
    logger.error(`[History Route] GET /leads/history/:id error: ${err.message}`);
    next(err);
  }
});

/**
 * DELETE /leads/history/:sessionId
 * Deletes a session and all its junction links.
 */
router.delete("/leads/history/:sessionId", protect, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    await deleteLeadSession(sessionId, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Session deleted",
    });
  } catch (err) {
    logger.error(
      `[History Route] DELETE /leads/history/:id error: ${err.message}`
    );
    next(err);
  }
});

export default router;
