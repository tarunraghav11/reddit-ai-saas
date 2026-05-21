import { useState } from "react";
import { deleteSession } from "../services/api";

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Sidebar component
 * Props:
 *  - user           : Supabase user object
 *  - sessions       : Array of lead session records
 *  - historyLoading : boolean
 *  - activeSessionId: string | null
 *  - collapsed      : boolean — controls collapsed state
 *  - onSelectSession: (session) => void
 *  - onNewSearch    : () => void
 *  - onSessionDeleted:(sessionId) => void
 *  - onLogout       : () => void
 */
export default function Sidebar({
  user,
  sessions,
  historyLoading,
  activeSessionId,
  collapsed,
  onSelectSession,
  onNewSearch,
  onSessionDeleted,
  onLogout,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    await deleteSession(sessionId);
    onSessionDeleted(sessionId);
    setDeletingId(null);
  };

  const avatarChar = user?.email?.[0]?.toUpperCase() || "U";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      {/* Brand + User */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🎯</div>
          <h2>LeadRadar</h2>
        </div>

        <div className="user-pill">
          <div className="user-avatar" aria-hidden="true">{avatarChar}</div>
          <div className="user-info">
            <div className="user-name" title={displayName}>{displayName}</div>
            <div className="user-label">Pro Account</div>
          </div>
          <button
            className="btn-logout"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
          >
            ⎋
          </button>
        </div>
      </div>

      {/* New Search CTA */}
      <button className="new-search-btn" onClick={onNewSearch}>
        ＋&nbsp;New Search
      </button>

      {/* Session History */}
      <nav className="session-list" aria-label="Search history">
        <div className="session-label">Search History</div>

        {historyLoading && (
          <>
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
          </>
        )}

        {!historyLoading && sessions.length === 0 && (
          <div className="empty-state" style={{ padding: "30px 10px" }}>
            <div className="empty-icon">🔍</div>
            <p>No past searches yet.<br />Run your first search!</p>
          </div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            role="button"
            tabIndex={0}
            aria-pressed={activeSessionId === session.id}
            className={`session-card${activeSessionId === session.id ? " active" : ""}`}
            onClick={() => onSelectSession(session)}
            onKeyDown={(e) => e.key === "Enter" && onSelectSession(session)}
          >
            <span className="session-icon" aria-hidden="true">📋</span>

            <div className="session-info">
              <div className="session-query" title={session.query}>
                {session.query}
              </div>
              <div className="session-meta">{formatDate(session.created_at)}</div>
            </div>

            <span className="session-badge" title={`${session.lead_count} leads`}>
              {session.lead_count}
            </span>

            <button
              className="session-del"
              onClick={(e) => handleDelete(e, session.id)}
              title="Delete session"
              aria-label={`Delete session: ${session.query}`}
              disabled={deletingId === session.id}
            >
              {deletingId === session.id ? "…" : "✕"}
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
