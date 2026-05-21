import { connection as redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const QUOTAS = {
  free: { search: 3, discover: 1 },
  starter: { search: 20, discover: 10 },
  pro: { search: 100, discover: 50 }
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

export const checkQuota = (type) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Read plan from user metadata (default to free)
      const plan = req.user?.user_metadata?.plan || req.user?.app_metadata?.plan || "free";
      const planName = String(plan).toLowerCase();
      const limit = QUOTAS[planName]?.[type] || QUOTAS.free[type];

      const today = getTodayString();
      const key = `quota:user:${userId}:${type}:${today}`;

      // 1. Get current usage
      const currentStr = await redis.get(key);
      const current = currentStr ? parseInt(currentStr, 10) : 0;

      if (current >= limit) {
        logger.warn(`[Quota] User ${userId} exceeded daily ${type} limit: ${current}/${limit}`);
        return res.status(429).json({
          success: false,
          message: `Daily limit of ${limit} ${type}s reached on the ${planName} plan. Upgrade your plan to increase limits.`
        });
      }

      // 2. Increment usage count
      const newCount = await redis.incr(key);
      if (newCount === 1) {
        await redis.expire(key, 86400); // Expires in 24 hours
      }

      // 3. Set response headers
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - newCount));

      next();
    } catch (err) {
      logger.error(`[Quota Middleware] Error checking quota: ${err.message}`);
      // Fallback: if Redis fails, do not block the request but log it
      next();
    }
  };
};
