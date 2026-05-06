import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import { validateUrl } from "../utils/urlValidator.js";
import { scrapeMultipleUrls } from "../services/urlService.js";
import { extractKeywordsFromText, analyzePosts } from "../services/aiService.js";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts } from "../services/redditRepository.js";
import { rankPosts, filterTopPosts } from "../services/rankingService.js";

const processDiscoverJob = async (job) => {
  const { urls } = job.data;
  
  try {
    // Stage 1: Validate URLs
    await job.updateProgress({ step: 10, message: "Validating URLs..." });
    const validUrls = await Promise.all(urls.map(validateUrl));

    // Stage 2: Scrape URLs
    await job.updateProgress({ step: 30, message: "Scraping content from URLs..." });
    const scrapedContent = await scrapeMultipleUrls(validUrls);
    
    if (!scrapedContent) {
      throw new Error("Failed to extract meaningful content from the provided URLs.");
    }

    // Stage 3: Extract Keywords via AI
    await job.updateProgress({ step: 50, message: "Extracting keywords via AI..." });
    const { category, painPoints, keywords } = await extractKeywordsFromText(scrapedContent);

    if (!keywords || keywords.length === 0) {
      throw new Error("AI could not generate relevant Reddit keywords from the content.");
    }

    // Stage 4: Fetch Reddit Posts
    await job.updateProgress({ step: 70, message: "Fetching relevant Reddit posts..." });
    const allPosts = [];
    for (const kw of keywords.slice(0, 3)) { // Limit to top 3 keywords to avoid hitting rate limits too hard
      const posts = await fetchRedditPosts(kw);
      allPosts.push(...posts);
      await savePosts(posts, kw); // Cache in background
    }

    // Deduplicate posts
    const uniquePosts = Array.from(new Map(allPosts.map((p) => [p.id, p])).values());

    if (uniquePosts.length === 0) {
      return { success: true, count: 0, category, painPoints, keywords, data: [] };
    }

    // Stage 5: Analyze Intent
    await job.updateProgress({ step: 85, message: "Analyzing post intent & scoring..." });
    const analyzedPosts = await analyzePosts(uniquePosts);

    // Stage 6: Rank & Filter
    await job.updateProgress({ step: 95, message: "Ranking and finalizing leads..." });
    const rankedPosts = rankPosts(analyzedPosts);
    const finalPosts = filterTopPosts(rankedPosts, 15);

    await job.updateProgress({ step: 100, message: "Done!" });

    return {
      success: true,
      count: finalPosts.length,
      category,
      painPoints,
      keywords,
      data: finalPosts
    };

  } catch (error) {
    logger.error(`[DiscoverWorker] Job ${job.id} failed: ${error.message}`);
    throw error; // Rethrow to let BullMQ handle retries
  }
};

// Initialize Worker
export const discoverWorker = new Worker("discover", processDiscoverJob, { connection });

discoverWorker.on('completed', (job) => {
  logger.info(`[DiscoverWorker] Job ${job.id} has completed!`);
});

discoverWorker.on('failed', (job, err) => {
  logger.error(`[DiscoverWorker] Job ${job.id} has failed with ${err.message}`);
});
