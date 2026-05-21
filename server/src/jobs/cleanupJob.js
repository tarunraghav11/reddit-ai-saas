import { cleanOldUnreferencedPosts } from "../services/redditRepository.js";
import { logger } from "../utils/logger.js";

// Run database cleanup job 10 seconds after server startup to avoid blocking startup activities
setTimeout(async () => {
  logger.info("[Cleanup] Running database TTL cleanup job on startup...");
  try {
    const deletedCount = await cleanOldUnreferencedPosts();
    logger.info(`[Cleanup] Startup database TTL cleanup completed. Deleted ${deletedCount} posts.`);
  } catch (err) {
    logger.error(`[Cleanup] Startup database TTL cleanup failed: ${err.message}`);
  }
}, 10000);

// Run database cleanup job every 24 hours recursively
setInterval(async () => {
  logger.info("[Cleanup] Running daily database TTL cleanup job...");
  try {
    const deletedCount = await cleanOldUnreferencedPosts();
    logger.info(`[Cleanup] Daily database TTL cleanup completed. Deleted ${deletedCount} posts.`);
  } catch (err) {
    logger.error(`[Cleanup] Daily database TTL cleanup failed: ${err.message}`);
  }
}, 24 * 60 * 60 * 1000);
