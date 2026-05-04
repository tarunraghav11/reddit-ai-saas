import dns from "dns/promises";
import { URL } from "url";

/**
 * Validate and sanitize URL input
 * Prevents SSRF (basic protection)
 */
export const validateUrl = async (input) => {
  try {
    if (!input || typeof input !== "string") {
      throw new Error("URL must be a non-empty string");
    }

    const url = new URL(input.trim());

    // Allow only http/https
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP/HTTPS protocols allowed");
    }

    // Resolve hostname → IP
    const { address } = await dns.lookup(url.hostname);

    // Block internal/private IP ranges
    if (
      address.startsWith("127.") ||      // localhost
      address.startsWith("10.") ||
      address.startsWith("192.168.") ||
      address.startsWith("169.254.")
    ) {
      throw new Error("Blocked internal IP address");
    }

    return url.href;

  } catch (err) {
    console.error("[URL Validator] Error:", err.message);
    throw new Error(`Invalid URL: ${err.message}`);
  }
};