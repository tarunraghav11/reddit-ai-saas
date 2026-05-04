export default function LeadCard({ post }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "10px",
      background: "#fff"
    }}>

      <h3>{post.title}</h3>

      <p style={{ color: "gray" }}>
        r/{post.subreddit}
      </p>

      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginTop: "8px" }}>
        <span>🔥 {post.upvotes}</span>
        <span>💬 {post.comments}</span>
        <span>Intent: {post.intent || "N/A"}</span>
        <span>Score: {post.finalScore ?? "-"}</span>
        <span>Opportunity: {post.opportunity ?? "-"}%</span>
      </div>

      {post.pain && (
        <p style={{ marginTop: "10px", fontStyle: "italic" }}>
          <strong>Pain:</strong> {post.pain}
        </p>
      )}

      {post.reason && (
        <p style={{ marginTop: "8px" }}>
          {post.reason}
        </p>
      )}

      <a href={post.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "10px" }}>
        View →
      </a>

    </div>
  );
}
