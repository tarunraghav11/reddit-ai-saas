const REDDIT_BASE_URL = "https://www.reddit.com/search.json";

/**
 * Fetch Reddit posts based on query
 */
export const fetchRedditPosts = async (query) => {
  try {
    if (!query || query.trim() === "") {
      throw new Error("Query is required");
    }

    const url = `${REDDIT_BASE_URL}?q=${encodeURIComponent(query)}&limit=10`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const json = await response.json();

    if (!json?.data?.children) {
      throw new Error("Invalid Reddit response structure");
    }

    // Normalize data
    const posts = json.data.children.map((item) => {
      const post = item.data;

      return {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        upvotes: post.ups,
        comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`,
        createdAt: new Date(post.created_utc * 1000)
      };
    });

    return posts;

  } catch (error) {
    console.error("❌ Reddit Service Error:", error.message);
    throw error;
  }
};