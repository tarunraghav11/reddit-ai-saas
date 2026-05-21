import { Worker } from "bullmq";
import { connection } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import { validateUrl } from "../utils/urlValidator.js";
import { scrapeMultipleUrls } from "../services/urlService.js";
import { extractKeywordsFromText, analyzePosts } from "../services/aiService.js";
import { fetchRedditPosts } from "../services/redditService.js";
import { savePosts, getAnalyzedPostsByIds } from "../services/redditRepository.js";
import { rankPosts, filterTopPosts } from "../services/rankingService.js";

const processDiscoverJob = async (job) => {
  const { urls, userId } = job.data;
  
  try {
    // Stage 1: Validate URLs
    await job.updateProgress({ step: 10, message: "Validating URLs..." });
    const validUrls = await Promise.all(urls.map(validateUrl));

    // Stage 2: Scrape URLs
    await job.updateProgress({ step: 30, message: "Scraping content from URLs..." });
    const scrapedContent = await scrapeMultipleUrls(validUrls);


    // Stage 3: Extract Keywords via AI
    await job.updateProgress({ step: 50, message: "Extracting keywords via AI..." });

    // scrapeMultipleUrls returns an array of strings — join them into one document
    const combinedContent = Array.isArray(scrapedContent)
      ? scrapedContent.join("\n\n---\n\n").trim()
      : String(scrapedContent || "").trim();

    if (!combinedContent) {
      throw new Error("Failed to extract meaningful content from the provided URLs.");
    }

    const { category, painPoints, keywords } = await extractKeywordsFromText(combinedContent);

    if (!keywords || keywords.length === 0) {
      // All AI models are rate-limited right now — return a partial result
      // instead of throwing (which would trigger BullMQ retry and hammer the API again).
      logger.warn(`[DiscoverWorker] Job ${job.id}: No keywords extracted (all models rate-limited). Returning empty result.`);
      await job.updateProgress({ step: 100, message: "Done (no keywords extracted — AI rate limited)" });
      return {
        success: true,
        count: 0,
        category: "Unknown",
        painPoints: [],
        keywords: [],
        data: [],
        warning: "AI models are currently rate-limited. Please try again in a few minutes."
      };
    }

    // Stage 4: Fetch Reddit Posts
    await job.updateProgress({ step: 70, message: "Fetching relevant Reddit posts..." });
    const allPosts = [];
    for (const kw of keywords.slice(0, 3)) { // Limit to top 3 keywords to avoid hitting rate limits too hard
      const posts = await fetchRedditPosts(kw);
      allPosts.push(...posts);
      await savePosts(posts, kw, userId); // Cache in background with userId
    }

    // Deduplicate posts
    const uniquePosts = Array.from(new Map(allPosts.map((p) => [p.id, p])).values());

    if (uniquePosts.length === 0) {
      return { success: true, count: 0, category, painPoints, keywords, data: [] };
    }

    // Stage 5: Analyze Intent (pass category as context for niche-aware classification)
    await job.updateProgress({ step: 85, message: "Analyzing post intent & scoring..." });
    
    // DRY Principle: Check for existing AI analysis in DB to avoid re-running AI
    const postIds = uniquePosts.map(p => p.id);
    const cachedAnalyzedPosts = await getAnalyzedPostsByIds(postIds);
    
    const cachedIds = new Set(cachedAnalyzedPosts.map(p => p.id));
    const postsToAnalyze = uniquePosts.filter(p => !cachedIds.has(p.id));
    
    let newlyAnalyzedPosts = [];
    if (postsToAnalyze.length > 0) {
      logger.info(`[DiscoverWorker] Analyzing ${postsToAnalyze.length} new posts. Skipping ${cachedAnalyzedPosts.length} cached analyses.`);
      newlyAnalyzedPosts = await analyzePosts(postsToAnalyze, category);
      
      // Save the newly analyzed results back to DB for future caching
      // We use a dummy query here or just update by ID
      await savePosts(newlyAnalyzedPosts, "analyzed_cache", userId);
    } else {
      logger.info(`[DiscoverWorker] All ${uniquePosts.length} posts were found in cache. Skipping AI analysis.`);
    }

    const analyzedPosts = [...cachedAnalyzedPosts, ...newlyAnalyzedPosts];

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
    const isRateLimit = error.message?.includes("429") || error.message?.includes("rate_limit");
    logger.error(`[DiscoverWorker] Job ${job.id} failed: ${error.message}`);
    
    if (isRateLimit) {
      // Don't retry rate-limit errors — they'll just fail again immediately.
      // Return a structured failure so the frontend can show a friendly message.
      return {
        success: false,
        count: 0,
        data: [],
        error: "AI rate limit reached. Please wait a few minutes and try again."
      };
    }

    throw error; // Re-throw non-rate-limit errors so BullMQ retries them
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
