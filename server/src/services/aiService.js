import Groq from "groq-sdk";
import { logger } from "../utils/logger.js";

let groq = null;

const getGroqClient = () => {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not set");
    }

    logger.info("[AI Service] Groq initialized");
    groq = new Groq({ apiKey });
  }
  return groq;
};

/**
 * Optimized prompt
 */
const SYSTEM_PROMPT = `
You are an expert SaaS sales analyst.

Your job is to identify REAL business opportunities from Reddit posts.

⚠️ CRITICAL: You must consider BOTH:
1. Post content
2. Subreddit CONTEXT TYPE

---

🎯 PRIMARY QUESTION:
"Is this a real-world problem or workflow where software could help?"

---

🧠 SUBREDDIT CONTEXT UNDERSTANDING:

Treat subreddit TYPE (not name):

🔴 LOW CONTEXT (almost always LOW):
- Meme / entertainment subreddits
- Image-based or curiosity subreddits
- Viral content / storytelling
- News / politics

Examples of types:
- memes
- "interesting"
- "today I learned"
- viral content
- political/news

👉 Even if the text sounds serious, DO NOT mark HIGH unless there is a REAL problem.

---

🟡 MEDIUM CONTEXT:
- General discussions
- Industry talk
- Casual professional conversations

---

🟢 HIGH CONTEXT (strong signals):
- Business, SaaS, startups, marketing, productivity
- Workflows, tools, systems
- Problem-solving discussions

---

📊 CLASSIFICATION:

HIGH (0.75 - 1.0):
- Clear frustration, inefficiency, or need
- User wants a better way, tool, or solution
- Strong SaaS opportunity

MEDIUM (0.4 - 0.74):
- Implicit inefficiency or workflow context
- Situation where software COULD help

LOW (0.0 - 0.39):
- Meme, entertainment, or storytelling
- News or passive information
- No actionable improvement scenario

---

🚫 STRICT RULE:
If subreddit context is entertainment/meme/news → default LOW  
UNLESS there is a clear real-world problem.

---

⚠️ DO NOT:
- Assume "medical", "AI", "tech" = opportunity
- Overclassify HIGH

---

ADDITIONAL REQUIREMENT:

For HIGH or MEDIUM intent posts, extract the CORE USER PAIN.

Pain = the real-world problem or frustration the user is facing.

Keep it short and specific.

---

OUTPUT FORMAT:

{
  "intent": "HIGH|MEDIUM|LOW",
  "score": number between 0 and 1,
  "pain": "short description of user problem (or null if LOW)",
  "reason": "short explanation"
}
`;
/**
 * RULE FALLBACK (ONLY used if AI fails)
 */
const detectIntentRule = (title) => {
  const text = title.toLowerCase();

  if (
    text.includes("best") ||
    text.includes("recommend") ||
    text.includes("tool") ||
    text.includes("software")
  ) {
    return {
      intent: "HIGH",
      score: 0.75,
      reason: "Fallback: recommendation intent"
    };
  }

  if (
    text.includes("how") ||
    text.includes("help") ||
    text.includes("problem")
  ) {
    return {
      intent: "MEDIUM",
      score: 0.5,
      reason: "Fallback: problem/help intent"
    };
  }

  return null;
};

/**
 * MAIN ANALYZER (AI FIRST)
 */
export const analyzeIntent = async (post) => {
  if (!post?.title) {
    return { intent: "LOW", score: 0, reason: "Invalid post" };
  }

  try {
    const client = getGroqClient();

    const response = await Promise.race([
      client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Classify this Reddit post and return JSON only:"${post.title}"`
          }
        ]
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI request timeout after 5s")), 5000)
      )
    ]);

    const text = response.choices?.[0]?.message?.content;

    if (!text) throw new Error("Empty response");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON");

    const parsed = JSON.parse(match[0]);

    if (!["HIGH", "MEDIUM", "LOW"].includes(parsed.intent)) {
      throw new Error("Invalid intent");
    }

    return {
  intent: parsed.intent,
  score: Math.min(1, Math.max(0, Number(parsed.score) || 0)),
  pain: parsed.pain || null,
  reason: parsed.reason || "AI analysis"
};
  } catch (err) {
    logger.error(`[AI Service] Error: ${err.message}`);

    // 🔥 FALLBACK ONLY HERE
    const fallback = detectIntentRule(post.title);
    if (fallback) return fallback;

    return {
  intent: "LOW",
  score: 0,
  pain: null,
  reason: "Final fallback"
};
  }
};

/**
 * PARALLEL PROCESSING (kept)
 */
export const analyzePosts = async (posts) => {
  if (!Array.isArray(posts)) return [];

  try {
    // 1. Analyze all posts
    const results = await Promise.all(
      posts.map(async (post) => {
        try {
          const analysis = await analyzeIntent(post);

          return {
  ...post,
  intent: analysis.intent,
  score: analysis.score,
  pain: analysis.pain,
  reason: analysis.reason
};
        } catch (err) {
          return {
            ...post,
            intent: "LOW",
            score: 0,
            reason: "Batch error"
          };
        }
      })
    );

    // Return all results so rankingService can decide what to filter
    return results;

  } catch (err) {
    logger.error(`[AI Service] Batch Error: ${err.message}`);
    return [];
  }
};

export const extractKeywordsFromText = async (content) => {
  try {
    if (!content || typeof content !== "string") {
      throw new Error("Content must be a non-empty string");
    }

    const client = getGroqClient();

    const prompt = `
You are a SaaS growth expert.

Analyze the following website content and extract:

1. Product category
2. Main pain points users face
3. 6-10 HIGH QUALITY Reddit search queries

IMPORTANT:
- Focus on real-world problems
- Focus on buying intent
- Generate queries like:
  - "alternatives to X"
  - "how to solve Y"
  - "tools for Z"
  - "problem with X"
  - "best way to do Y"

STRICT RULE:
Only generate keywords directly related to:
- marketing
- SaaS tools
- Reddit lead generation
- business workflows

DO NOT generate generic queries like:
- personal finance
- unrelated domains

RETURN STRICT JSON:

{
  "category": "",
  "painPoints": [],
  "keywords": []
}

Content:
${content.slice(0, 4000)}
`;

    const response = await Promise.race([
      client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt }
        ]
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Keyword extraction timeout")), 7000)
      )
    ]);

    const text = response.choices?.[0]?.message?.content;

    if (!text) throw new Error("Empty AI response");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON");

    const parsed = JSON.parse(match[0]);

    return {
      category: parsed.category || "Unknown",
      painPoints: parsed.painPoints || [],
      keywords: (parsed.keywords || []).slice(0, 10)
    };

  } catch (err) {
    logger.error(`[AI Keyword Extraction] Error: ${err.message}`);

    // fallback minimal keywords
    return {
      category: "Unknown",
      painPoints: [],
      keywords: ["software problems", "tools for business"]
    };
  }
};