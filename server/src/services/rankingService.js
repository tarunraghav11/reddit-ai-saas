const normalize = (value, max) => {
  if (!max) return 0;
  return Math.min(1, value / max);
};

const getRecencyScore = (createdAt) => {
  try {
    const now = Date.now();
    const created = new Date(createdAt).getTime();

    const diffHours = (now - created) / (1000 * 60 * 60);

    return Math.max(0, 1 - diffHours / 72);
  } catch {
    return 0;
  }
};

export const rankPosts = (posts) => {
  try {
    if (!Array.isArray(posts) || posts.length === 0) return [];

    const upvotesValues = posts.map(p => p.upvotes || 0);
    const commentsValues = posts.map(p => p.comments || 0);
    const maxUpvotes = Math.max(...upvotesValues) || 1;
    const maxComments = Math.max(...commentsValues) || 1;

    const intentWeight = {
      HIGH: 1,
      MEDIUM: 0.6,
      LOW: 0.2
    };

    const ranked = posts.map(post => {
      const aiScore = Number(post.score) || 0;

      const engagement =
        (normalize(post.upvotes, maxUpvotes) * 0.7) +
        (normalize(post.comments, maxComments) * 0.3);

      const recency = getRecencyScore(post.createdAt);

      const intentScore = intentWeight[post.intent] || 0;

      const finalScore =
        (intentScore * 0.4) +
        (aiScore * 0.3) +
        (engagement * 0.2) +
        (recency * 0.1);

      const final = Number(finalScore.toFixed(3));

      return {
        ...post,
        finalScore: final,
        opportunity: Math.round(final * 100)
      };
    });

    return ranked.sort((a, b) => b.finalScore - a.finalScore);

  } catch (err) {
    console.error("[Ranking] Error:", err.message);
    return posts;
  }
};

export const filterTopPosts = (posts, limit = 5) => {
  try {
    if (!Array.isArray(posts)) return [];

    // Keep HIGH + MEDIUM always
    let filtered = posts.filter(
      p => p.intent === "HIGH" || p.intent === "MEDIUM"
    );

    //  If too few results → include best LOW
    if (filtered.length < limit) {
      const lowPosts = posts
        .filter(p => p.intent === "LOW")
        .sort((a, b) => b.finalScore - a.finalScore);

      filtered = [...filtered, ...lowPosts];
    }

    return filtered.slice(0, limit);

  } catch (err) {
    console.error("[Filter] Error:", err.message);
    return [];
  }
};