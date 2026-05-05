import { z } from "zod";

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
  try {
    const schema = z.string({
      required_error: "Query parameter is required and must be a non-empty string",
      invalid_type_error: "Query parameter must be a string",
    }).trim().min(1, "Query parameter is required and must be a non-empty string");
    
    return schema.parse(query);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(err.errors[0].message);
    }
    throw err;
  }
};

/**
 * Validate urls array for discover route
 * @param {Array} urls - Array of URL strings
 * @returns {Array} Validated URLs
 * @throws {Error} If array is invalid
 */
export const validateUrlsArray = (urls) => {
  try {
    // Basic type check to give identical error message as before if it's not an array at all
    if (!Array.isArray(urls)) throw new Error("URLs must be a non-empty array");

    const schema = z.array(z.string().url("Invalid URL format"))
      .min(1, "URLs must be a non-empty array")
      .max(5, "Maximum 5 URLs allowed");
    
    return schema.parse(urls);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(err.errors[0].message);
    }
    throw err;
  }
};
