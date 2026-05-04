import axios from "axios";
import * as cheerio from "cheerio";
const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_CONTENT_LENGTH = 5000; // limit text size

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
    console.error("[URL Service] Extraction error:", err.message);
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
      console.warn(`[URL Service] Low content from: ${url}`);
    }

    console.log(`[URL Service] Scraped: ${url}`);

    return content;

  } catch (err) {
    console.error(`[URL Service] Failed for ${url}:`, err.message);

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
    console.error("[URL Service] Multiple scrape error:", err.message);
    throw err;
  }
};