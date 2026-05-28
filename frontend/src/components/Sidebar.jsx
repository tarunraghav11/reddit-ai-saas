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
  onSelectBilling,
}) {
  const [deletingId, setDeletingId] = useState(null);
  
  const rawPlan = user?.app_metadata?.plan || user?.user_metadata?.plan || "free";
  const userPlan = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1) + " Plan";

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
        <div
          className="sidebar-brand"
          onClick={onNewSearch}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNewSearch()}
          aria-label="New Search"
        >
          <div className="sidebar-logo" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width="24" height="24" style={{ fill: "#a855f7" }}>
              <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.3-4.14 4.26 1c.02.99.83 1.77 1.83 1.77 1.02 0 1.85-.83 1.85-1.85 0-1.02-.83-1.85-1.85-1.85-.84 0-1.55.57-1.77 1.34L13.12 1.82C12.96 1.76 12.79 1.85 12.73 2l-1.5 4.76C8.78 6.85 6.54 7.5 4.9 8.5 4.33 7.74 3.43 7.26 2.47 7.26c-1.65 0-3 1.35-3 3 0 1.2.71 2.24 1.74 2.72-.08.38-.11.77-.11 1.16 0 3.86 4.43 7 9.9 7s9.9-3.14 9.9-7c0-.39-.03-.78-.11-1.16 1.03-.48 1.74-1.52 1.74-2.72zm-16.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 3c-1.8 1.8-5.2 1.8-7 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.4 1.4 4.2 1.4 5.6 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm.5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <h2>LeadRadar</h2>
        </div>

        <div className="user-pill">
          <div className="user-avatar" aria-hidden="true">{avatarChar}</div>
          <div className="user-info">
            <div className="user-name" title={displayName}>{displayName}</div>
            <div className="user-label">{userPlan}</div>
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
      <div className="sidebar-ctas">
        <button className="new-search-btn" onClick={onNewSearch}>
          ＋&nbsp;New Search
        </button>
        <button className="billing-nav-btn" onClick={onSelectBilling}>
          💳&nbsp;&nbsp;Billing & Quotas
        </button>
      </div>

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
