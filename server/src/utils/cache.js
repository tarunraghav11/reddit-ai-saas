/**
 * Cache Configuration
 */
const CACHE_TTL_MINUTES = parseInt(process.env.CACHE_TTL_MINUTES || '2', 10);
const CACHE_TTL_MS = CACHE_TTL_MINUTES * 60 * 1000;

/**
 * Check if cached posts are still fresh
 * @param {Array} posts - Cached posts with fetched_at timestamps (in ms)
 * @returns {boolean} True if cache is within TTL
 */
export const isCacheFresh = (posts) => {
  try {
    if (!Array.isArray(posts) || posts.length === 0) return false;

    // Get the most recent timestamp from the batch
    const latestTime = Math.max(...posts.map(p => Number(p.fetched_at) || 0));
    if (latestTime === 0) return false;

    const ageMs = Date.now() - latestTime;
    const isValid = ageMs <= CACHE_TTL_MS;

    if (!isValid) {
      console.log(`[Cache] MISS: ${(ageMs / 60000).toFixed(2)}min old | TTL: ${CACHE_TTL_MINUTES}min`);
    } else {
      console.log(`[Cache] HIT: ${(ageMs / 60000).toFixed(2)}min old | TTL: ${CACHE_TTL_MINUTES}min`);
    }

    return isValid;
  } catch (err) {
    console.error("[Cache] Error checking freshness:", err.message);
    return false;
  }
};

export const getCacheTTLMs = () => CACHE_TTL_MS;