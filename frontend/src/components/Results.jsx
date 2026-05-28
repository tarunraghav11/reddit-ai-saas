import LeadCard from "./LeadCard";

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

export default function Results({ posts, info, sessionMeta = null }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No leads found</h3>
        <p>Try a different keyword or URL to discover opportunities.</p>
      </div>
    );
  }

  return (
    <div className="results-wrap">
      {/* Info / session metadata bar */}
      {(info || sessionMeta) && (
        <div className="info-bar">
          {sessionMeta && (
            <span className="info-chip">
              📅 <strong>{formatDate(sessionMeta.created_at)}</strong>
            </span>
          )}

          {(info?.count ?? posts.length) > 0 && (
            <span className="info-chip">
              📊 <strong>{info?.count ?? posts.length}</strong> leads
            </span>
          )}
          {info?.category && (
            <span className="info-chip">
              🏷 <strong>{info.category}</strong>
            </span>
          )}
          {info?.keywords?.length > 0 && (
            <span className="info-chip">
              🔑 {info.keywords.slice(0, 3).join(", ")}
            </span>
          )}
        </div>
      )}

      <p className="results-heading">
        {posts.length} lead{posts.length !== 1 ? "s" : ""} found
      </p>

      {posts.map((post) => (
        <LeadCard key={post.id} post={post} />
      ))}
    </div>
  );
}
