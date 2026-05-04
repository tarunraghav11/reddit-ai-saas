import LeadCard from "./LeadCard";

export default function Results({ posts, info }) {
  if (!posts.length) return <p>No results yet</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      {info && (
        <div style={{ marginBottom: "16px", padding: "12px", background: "#f9f9ff", borderRadius: "10px" }}>
          {info.category && <p><strong>Category:</strong> {info.category}</p>}
          {info.count != null && <p><strong>Results:</strong> {info.count}</p>}
          {info.source && <p><strong>Source:</strong> {info.source}</p>}
          {info.keywords?.length > 0 && (
            <p><strong>Keywords:</strong> {info.keywords.join(", ")}</p>
          )}
          {info.painPoints?.length > 0 && (
            <p><strong>Pain points:</strong> {info.painPoints.join(", ")}</p>
          )}
        </div>
      )}

      {posts.map((post) => (
        <LeadCard key={post.id} post={post} />
      ))}
    </div>
  );
}
