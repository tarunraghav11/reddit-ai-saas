import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const discoverQueue = new Queue("discover", { connection });

export const addDiscoverJob = async (urls) => {
  const job = await discoverQueue.add("discoverLeads", { urls }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
  return job.id;
};
