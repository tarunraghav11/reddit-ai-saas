import Groq from "groq-sdk";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────

let clients = [];
let currentClientIdx = 0;

const getGroqClients = () => {
  if (clients.length === 0) {
    const keys = [];
    if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);

    // Support multiple keys: GROQ_API_KEY_1, GROQ_API_KEY_2, etc.
    let i = 1;
    while (process.env[`GROQ_API_KEY_${i}`]) {
      keys.push(process.env[`GROQ_API_KEY_${i}`]);
      i++;
    }

    if (keys.length === 0) {
      throw new Error("No Groq API keys found. Please set GROQ_API_KEY or GROQ_API_KEY_1...");
    }

    clients = keys.map(apiKey => new Groq({ apiKey }));
    logger.info(`[AI Service] Initialized ${clients.length} Groq clients from environment keys.`);
  }
  return clients;
};

/**
 * Returns the next Groq client in rotation
 */
const getNextClient = () => {
  const allClients = getGroqClients();
  const client = allClients[currentClientIdx];
  currentClientIdx = (currentClientIdx + 1) % allClients.length;
  return client;
};

// ─────────────────────────────────────────────
// MODEL POOL
// Primary model has the highest TPD on Groq free tier.
// On 429, we automatically rotate to the next model.
// The heavy 70B model is reserved for complex tasks only.
// ─────────────────────────────────────────────

const CLASSIFICATION_MODELS = [
  "llama-3.1-8b-instant",   // Primary: ~500k TPD, fast, smart enough for classification
  "llama3-8b-8192",          // Fallback 1: separate TPD bucket
  "gemma2-9b-it",            // Fallback 2: separate TPD bucket
];

const HEAVY_MODEL = "llama-3.3-70b-versatile"; // Reserved for keyword extraction only

// ─────────────────────────────────────────────
// MODEL ROTATION HELPER
// Tries each model in the pool on 429, falls through to the next.
// ─────────────────────────────────────────────

const callWithModelFallback = async (messages, maxTokens = 2000, timeoutMs = 25000) => {
  const client = getNextClient();

  for (let i = 0; i < CLASSIFICATION_MODELS.length; i++) {
    const model = CLASSIFICATION_MODELS[i];
    try {
      const response = await Promise.race([
        client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
          messages,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      logger.info(`[AI Service] Batch classified with model: ${model}`);
      return response;

    } catch (err) {
      const is429 = err.message?.includes("429") || err.status === 429;

      if (is429 && i < CLASSIFICATION_MODELS.length - 1) {
        logger.warn(`[AI Service] Model ${model} rate limited (429). Rotating to next model...`);
        continue; // Try next model
      }

      // Not a 429, or we've exhausted all models
      throw err;
    }
  }
};

// ─────────────────────────────────────────────
// SYSTEM PROMPT (shared for batch classification)
// ─────────────────────────────────────────────

const BATCH_SYSTEM_PROMPT = `
You are an expert SaaS sales analyst identifying REAL business opportunities from Reddit posts.

⚠️ CRITICAL RULES:
1. If TARGET CONTEXT is provided, ONLY classify as HIGH/MEDIUM if the post directly relates to that niche. Otherwise, classify as LOW.
2. Zero tolerance for irrelevance: when in doubt, classify LOW.
3. Entertainment, meme, news, and political posts are ALWAYS LOW.

📊 CLASSIFICATION:
HIGH (0.75-1.0): Clear frustration, user wants a tool/solution, strong niche match.
MEDIUM (0.4-0.74): Implicit need, software COULD help, relevant to niche.
LOW (0.0): Irrelevant, entertainment, no actionable opportunity.

For HIGH and MEDIUM: extract a concise "pain" point (e.g. "Struggling to automate X", "Cannot find affordable Y").

You will receive a JSON array of posts. Classify each one.

⚠️ OUTPUT: Return ONLY a valid JSON object in this exact format, no extra text:
{
  "results": [
    { "id": 0, "intent": "HIGH|MEDIUM|LOW", "score": 0.0, "pain": "string or null", "reason": "string" },
    { "id": 1, "intent": "HIGH|MEDIUM|LOW", "score": 0.0, "pain": "string or null", "reason": "string" }
  ]
}
`;

// ─────────────────────────────────────────────
// RULE-BASED FALLBACK
// Used only if all AI models fail.
// ─────────────────────────────────────────────

const detectIntentRule = (title) => {
  const text = title.toLowerCase();

  if (text.includes("best") || text.includes("recommend") || text.includes("tool") || text.includes("software")) {
    return { intent: "HIGH", score: 0.75, pain: null, reason: "Fallback: recommendation intent" };
  }
  if (text.includes("how") || text.includes("help") || text.includes("problem")) {
    return { intent: "MEDIUM", score: 0.5, pain: null, reason: "Fallback: problem/help intent" };
  }
  return null;
};

// ─────────────────────────────────────────────
// CORE: BATCH INTENT ANALYSIS
// Sends a chunk of posts in ONE AI call.
// Returns an array of analysis results mapped to post index.
// ─────────────────────────────────────────────

const analyzeIntentBatch = async (posts, context = null) => {
  const postsPayload = posts.map((p, idx) => ({
    id: idx,
    title: p.title,
    content: (p.content || "").slice(0, 400), // trim content to keep tokens low
    subreddit: p.subreddit || "",
  }));

  const userMessage = `
${context ? `TARGET PRODUCT CONTEXT: ${context}\n` : ""}
Classify these Reddit posts:
${JSON.stringify(postsPayload, null, 2)}
`;

  const messages = [
    { role: "system", content: BATCH_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  const response = await callWithModelFallback(messages, 2000, 25000);
  const text = response.choices?.[0]?.message?.content;

  if (!text) throw new Error("Empty batch response from AI");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned non-JSON batch response");

  const parsed = JSON.parse(match[0]);

  if (!Array.isArray(parsed.results)) throw new Error("AI batch response missing 'results' array");

  return parsed.results;
};

// ─────────────────────────────────────────────
// PUBLIC: analyzeIntent (single post, kept for compatibility)
// ─────────────────────────────────────────────

export const analyzeIntent = async (post, context = null) => {
  if (!post?.title) return { intent: "LOW", score: 0, reason: "Invalid post" };

  try {
    const results = await analyzeIntentBatch([post], context);
    const r = results[0];
    if (!r || !["HIGH", "MEDIUM", "LOW"].includes(r.intent)) throw new Error("Invalid single-post result");

    return {
      intent: r.intent,
      score: Math.min(1, Math.max(0, Number(r.score) || 0)),
      pain: r.pain || null,
      reason: r.reason || "AI analysis",
    };
  } catch (err) {
    logger.error(`[AI Service] analyzeIntent error: ${err.message}`);
    const fallback = detectIntentRule(post.title);
    if (fallback) return fallback;
    return { intent: "LOW", score: 0, pain: null, reason: "Final fallback" };
  }
};

// ─────────────────────────────────────────────
// PUBLIC: analyzePosts (bulk, batched + model rotation)
// ─────────────────────────────────────────────

export const analyzePosts = async (posts, context = null) => {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const CHUNK_SIZE = 8; // Optimal: keeps token count manageable per call
  const results = new Array(posts.length);

  logger.info(`[AI Service] Analyzing ${posts.length} posts in chunks of ${CHUNK_SIZE}`);

  for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
    const chunk = posts.slice(i, i + CHUNK_SIZE);
    const chunkStart = i;

    try {
      const batchResults = await analyzeIntentBatch(chunk, context);

      chunk.forEach((post, localIdx) => {
        const analysis = batchResults.find(r => String(r.id) === String(localIdx));

        if (!analysis || !["HIGH", "MEDIUM", "LOW"].includes(analysis.intent)) {
          // Per-item fallback if AI missed this post in the batch
          const fallback = detectIntentRule(post.title);
          results[chunkStart + localIdx] = {
            ...post,
            intent: fallback?.intent || "LOW",
            score: fallback?.score || 0,
            pain: fallback?.pain || null,
            reason: fallback?.reason || "Batch item missing from AI response",
          };
        } else {
          results[chunkStart + localIdx] = {
            ...post,
            intent: analysis.intent,
            score: Math.min(1, Math.max(0, Number(analysis.score) || 0)),
            pain: analysis.pain || null,
            reason: analysis.reason || "Batch AI analysis",
          };
        }
      });

    } catch (err) {
      logger.error(`[AI Service] Chunk [${chunkStart}-${chunkStart + chunk.length - 1}] failed: ${err.message}. Applying rule-based fallback.`);

      // Rule-based fallback for the whole failed chunk
      chunk.forEach((post, localIdx) => {
        const fallback = detectIntentRule(post.title);
        results[chunkStart + localIdx] = {
          ...post,
          intent: fallback?.intent || "LOW",
          score: fallback?.score || 0,
          pain: fallback?.pain || null,
          reason: `Chunk failed (${err.message}) - rule fallback`,
        };
      });
    }
  }

  const classified = results.filter(Boolean);
  const high = classified.filter(p => p.intent === "HIGH").length;
  const medium = classified.filter(p => p.intent === "MEDIUM").length;
  logger.info(`[AI Service] Classification done: ${high} HIGH, ${medium} MEDIUM, ${classified.length - high - medium} LOW`);

  return classified;
};

// ─────────────────────────────────────────────
// PUBLIC: extractKeywordsFromText
// Uses the heavy 70B model — called once per discover job, not per post.
// ─────────────────────────────────────────────

export const extractKeywordsFromText = async (content) => {
  try {
    if (!content || typeof content !== "string") {
      throw new Error("Content must be a non-empty string");
    }

    const prompt = `
You are a SaaS growth expert.

Analyze the following website content and extract:

1. Detailed Product Niche (e.g., "B2B SaaS for Email Marketing" or "Mobile App for Yoga & Meditation")
2. Main pain points users face
3. 6-10 HIGH QUALITY Reddit search queries

IMPORTANT:
- Focus on real-world problems and buying intent.
- Generate queries like: "alternatives to X", "how to solve Y", "tools for Z", "problem with X", "best way to do Y"

STRICT RULE:
Generate keywords specific to the content's domain. Do NOT default to generic business terms.
Focus on what real users in that niche search for on Reddit.

RETURN STRICT JSON:
{
  "category": "",
  "painPoints": [],
  "keywords": []
}

Content:
${content.slice(0, 8000)}
`;

    // Try the full model pool — heavy model first, then lighter fallbacks on 429
    const ALL_MODELS = [HEAVY_MODEL, ...CLASSIFICATION_MODELS];
    const client = getNextClient();
    let response = null;

    for (let i = 0; i < ALL_MODELS.length; i++) {
      const model = ALL_MODELS[i];
      try {
        response = await Promise.race([
          client.chat.completions.create({
            model,
            max_tokens: 400,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: prompt }],
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Keyword extraction timeout after 15s")), 15000)
          ),
        ]);
        logger.info(`[AI Keyword Extraction] Extracted keywords with model: ${model}`);
        break; // success — stop rotating
      } catch (err) {
        const is429 = err.message?.includes("429") || err.status === 429;
        if (is429 && i < ALL_MODELS.length - 1) {
          logger.warn(`[AI Keyword Extraction] Model ${model} rate limited. Rotating to next...`);
          continue;
        }
        throw err; // non-429 error or all models exhausted
      }
    }

    const text = response?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from keyword extraction");

    const parsed = JSON.parse(match[0]);

    return {
      category: parsed.category || "Unknown",
      painPoints: parsed.painPoints || [],
      keywords: (parsed.keywords || []).slice(0, 10),
    };

  } catch (err) {
    logger.error(`[AI Keyword Extraction] Error: ${err.message}`);
    return { category: "Unknown", painPoints: [], keywords: [] };
  }
};

// ─────────────────────────────────────────────
// PUBLIC: generateOutreach
// Generates 2 concise, personalized Reddit reply drafts.
// Reuses callWithModelFallback for automatic 429 rotation.
// ─────────────────────────────────────────────

const OUTREACH_SYSTEM_PROMPT = `You write helpful Reddit replies for SaaS founders. Rules:
- Sound human, empathetic, NOT salesy
- Provide genuine value first
- Keep each reply under 80 words
- Never mention product names unless given
Return JSON: { "replies": [ { "tone": "friendly|professional", "text": "..." }, { "tone": "...", "text": "..." } ] }`;

export const generateOutreach = async ({ title, pain, subreddit, reason }) => {
  const userMsg = `Post: "${title}"${subreddit ? ` in r/${subreddit}` : ""}${pain ? `\nPain: ${pain}` : ""}${reason ? `\nContext: ${reason}` : ""}\n\nWrite 2 reply drafts.`;

  const messages = [
    { role: "system", content: OUTREACH_SYSTEM_PROMPT },
    { role: "user", content: userMsg },
  ];

  const response = await callWithModelFallback(messages, 400, 15000);
  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty outreach response");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid JSON from outreach");

  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.replies) || parsed.replies.length === 0) {
    throw new Error("No replies in AI response");
  }

  return parsed.replies.slice(0, 2);
};