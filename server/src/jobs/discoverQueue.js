import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const discoverQueue = new Queue("discover", { connection });

export const addDiscoverJob = async (urls, userId = null) => {
  const job = await discoverQueue.add("discoverLeads", { urls, userId }, {
    attempts: 2,        // max 2 attempts (1 retry) — rate-limit errors won't retry at all
    backoff: {
      type: "exponential",
      delay: 30000      // 30s base delay, so retry happens at ~30s then ~60s
    },
    removeOnComplete: false,
    removeOnFail: false
  });
  return job.id;
};
