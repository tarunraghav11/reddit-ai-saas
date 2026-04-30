/**
 * Centralized validation utilities
 */

/**
 * Validate and normalize search query
 * @param {string} query - Raw query string
 * @returns {string} Normalized query (trimmed)
 * @throws {Error} If query is invalid
 */
export const validateQuery = (query) => {
  if (!query || typeof query !== "string" || query.trim() === "") {
    throw new Error("Query parameter is required and must be a non-empty string");
  }
  return query.trim();
};
