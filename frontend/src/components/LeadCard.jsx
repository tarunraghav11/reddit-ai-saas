export default function LeadCard({ post }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "10px"
    }}>

      <h3>{post.title}</h3>

      <p style={{ color: "gray" }}>
        r/{post.subreddit}
      </p>

      <div style={{ display: "flex", gap: "15px" }}>
        <span>🔥 {post.upvotes}</span>
        <span>💬 {post.comments}</span>
      </div>

      <div style={{ marginTop: "5px" }}>
        <strong>{post.intent}</strong> | Score: {post.finalScore}
      </div>

      <p style={{ marginTop: "5px" }}>
        {post.reason}
      </p>

      <a href={post.url} target="_blank">
        View →
      </a>

    </div>
  );
}