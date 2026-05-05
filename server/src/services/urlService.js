import axios from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";
import { logger } from "../utils/logger.js";

const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_CONTENT_LENGTH = 5000; // limit text size

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn(`[URL Service] Retrying request (attempt ${retryCount}) due to ${error.message}`);
  }
});

/**
 * Clean extracted text
 */
const cleanText = (text) => {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
};

/**
 * Extract meaningful content from HTML
 */
const extractContent = ($) => {
  try {
    // Remove junk elements
    $("script, style, noscript, iframe, nav, footer, header").remove();

    let text = $("body").text();

    text = cleanText(text);

    // Limit size to avoid huge AI payload
    return text.slice(0, MAX_CONTENT_LENGTH);

  } catch (err) {
    logger.error(`[URL Service] Extraction error: ${err.message}`);
    return "";
  }
};

/**
 * Scrape a single URL
 */
export const scrapeUrl = async (url) => {
  try {
    if (!url) {
      throw new Error("URL is required");
    }

    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        "User-Agent": "Mozilla/5.0 (LeadFinderBot)"
      },
      validateStatus: (status) => status < 500 // allow 4xx but not crash
    });

    if (!response.data) {
      throw new Error("Empty response body");
    }

    const $ = cheerio.load(response.data);

    const content = extractContent($);

    if (!content || content.length < 50) {
      logger.warn(`[URL Service] Low content from: ${url}`);
    }

    logger.info(`[URL Service] Scraped: ${url}`);

    return content;

  } catch (err) {
    logger.error(`[URL Service] Failed for ${url}: ${err.message}`);

    // IMPORTANT: don't crash pipeline
    return null;
  }
};

/**
 * Scrape multiple URLs in parallel
 */
export const scrapeMultipleUrls = async (urls = []) => {
  try {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("URLs must be a non-empty array");
    }

    // Limit URLs (safety)
    const limitedUrls = urls.slice(0, 5);

    const results = await Promise.all(
      limitedUrls.map(async (url) => {
        return await scrapeUrl(url);
      })
    );

    // Remove null/empty
    const validContents = results.filter(
      (text) => text && text.length > 0
    );

    if (validContents.length === 0) {
      throw new Error("Failed to extract content from all URLs");
    }

    return validContents;

  } catch (err) {
    logger.error(`[URL Service] Multiple scrape error: ${err.message}`);
    throw err;
  }
};