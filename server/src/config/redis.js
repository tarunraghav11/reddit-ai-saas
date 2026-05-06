import { Redis } from "ioredis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error("[Redis] REDIS_URL is not defined in .env");
  // Don't crash immediately, let BullMQ fail gracefully if possible or exit if we strictly need it
}

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => logger.info("[Redis] Connected successfully"));
connection.on("error", (err) => logger.error(`[Redis] Connection error: ${err.message}`));
