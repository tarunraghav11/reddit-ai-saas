import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Results from "../components/Results";
import {
  fetchLeads,
  discoverLeads,
  checkJobStatus,
  getLeadHistory,
  getSessionLeads,
} from "../services/api";
import { logout } from "../auth/authService";

export default function MainApp({ user }) {
  const [posts, setPosts]               = useState([]);
  const [info, setInfo]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [progressMsg, setProgressMsg]   = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [mode, setMode]                 = useState("search");

  // inline input state
  const [query, setQuery]   = useState("");
  const [urls, setUrls]     = useState("");

  // sidebar / history
  const [sessions, setSessions]                 = useState([]);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [activeSessionId, setActiveSessionId]   = useState(null);
  const [activeSessionMeta, setActiveSessionMeta] = useState(null);
  const [sidebarOpen, setSidebarOpen]           = useState(true);

  // Refs for tracking/canceling background polling & unmount cleanup
  const pollTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const cancelPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setProgressMsg("");
    setProgressPercent(0);
  }, []);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    const res = await getLeadHistory(0);
    if (res.success) setSessions(res.data || []);
    setHistoryLoading(false);
  }, [user]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Search ──────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    cancelPolling();
    setError(""); setLoading(true);
    setActiveSessionId(null); setActiveSessionMeta(null);
    setPosts([]); setInfo(null);
    const response = await fetchLeads(query.trim());
    setLoading(false);
    if (!response.success) { setError(response.message || "Unable to fetch leads"); return; }
    setPosts(response.data || []);
    setInfo({ source: response.source, count: response.count, keywords: response.keywords, category: response.category, painPoints: response.painPoints });
    loadHistory();
  };

  // ── Discover ────────────────────────────────────────────────
  const handleDiscover = async (e) => {
    e?.preventDefault();
    const list = urls.split(/\r?\n|,/).map(u => u.trim()).filter(Boolean).slice(0, 5);
    if (list.length === 0 || loading) return;
    cancelPolling();
    setError(""); setLoading(true); setProgressMsg("Starting background job..."); setProgressPercent(0);
    setPosts([]); setInfo(null); setActiveSessionId(null);
    const response = await discoverLeads(list);
    if (!response.success || !response.jobId) {
      setLoading(false); setProgressMsg("");
      setError(response.message || "Unable to start discovery job"); return;
    }
    // NOTE (Scaling Roadmap): This uses 2-second short polling to check job status.
    // While suitable for MVP / low traffic, as the application scales, this should be migrated to:
    // 1. Server-Sent Events (SSE) for one-way server-to-client updates.
    // 2. WebSockets if bi-directional interaction is needed.
    // This will significantly reduce the number of HTTP requests and database queries on the backend.
    const poll = async () => {
      const statusRes = await checkJobStatus(response.jobId);
      if (!isMountedRef.current) return;
      if (!statusRes.success) { setLoading(false); setProgressMsg(""); setProgressPercent(0); setError(statusRes.message || "Error"); return; }
      if (statusRes.status === "completed") {
        setLoading(false); setProgressMsg(""); setProgressPercent(0);
        setPosts(statusRes.result?.data || []);
        setInfo({ source: "discover", count: statusRes.result?.count || 0, keywords: statusRes.result?.keywords || [], category: statusRes.result?.category || "", painPoints: statusRes.result?.painPoints || [] });
        loadHistory(); return;
      }
      if (statusRes.status === "failed") { setLoading(false); setProgressMsg(""); setProgressPercent(0); setError(statusRes.message || "Job failed"); return; }
      setProgressPercent(statusRes.progress || 0);
      setProgressMsg(statusRes.message || "Processing...");
      pollTimeoutRef.current = setTimeout(poll, 2000);
    };
    poll();
  };

  const handleSelectSession = async (session) => {
    cancelPolling();
    setError(""); setLoading(true);
    setActiveSessionId(session.id); setActiveSessionMeta(session);
    setPosts([]); setInfo(null);
    const res = await getSessionLeads(session.id);
    setLoading(false);
    if (!res.success) { setError(res.message || "Could not load session"); return; }
    setPosts(res.data || []);
    setInfo(null);
  };

  const handleSessionDeleted = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null); setActiveSessionMeta(null);
      setPosts([]); setInfo(null);
    }
  };

  const handleNewSearch = () => {
    cancelPolling();
    setActiveSessionId(null); setActiveSessionMeta(null);
    setPosts([]); setInfo(null); setError(""); setQuery(""); setUrls("");
  };

  const handleLogout = async () => { await logout(); window.location.href = "/"; };

  const hasResults  = posts.length > 0;
  const isIdle      = !loading && !hasResults && !activeSessionMeta && !error;

  return (
    <div className="app-shell">
      {/* Sidebar toggle (mobile) */}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">☰</button>

      <Sidebar
        user={user}
        sessions={sessions}
        historyLoading={historyLoading}
        activeSessionId={activeSessionId}
        collapsed={!sidebarOpen}
        onSelectSession={handleSelectSession}
        onNewSearch={handleNewSearch}
        onSessionDeleted={handleSessionDeleted}
        onLogout={handleLogout}
      />

      <main className="dash-main">

        {/* ── TOP BAR ────────────────────────────────────── */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            {activeSessionMeta ? (
              <>
                <button className="dash-back-btn" onClick={handleNewSearch} title="Back to search">← Back</button>
                <span className="dash-breadcrumb">"{activeSessionMeta.query}"</span>
                <span className="dash-breadcrumb-sub">Saved session</span>
              </>
            ) : (
              <h1 className="dash-title">Find Leads</h1>
            )}
          </div>

          {/* Mode tabs top-right */}
          {!activeSessionMeta && (
            <div className="dash-mode-tabs">
              <button
                id="tab-search"
                className={`dash-tab ${mode === "search" ? "dash-tab-active" : ""}`}
                onClick={() => setMode("search")}
              >
                <span className="dash-tab-icon">🔍</span>
                Search Reddit
              </button>
              <button
                id="tab-discover"
                className={`dash-tab ${mode === "discover" ? "dash-tab-active" : ""}`}
                onClick={() => setMode("discover")}
              >
                <span className="dash-tab-icon">🌐</span>
                Discover from URLs
              </button>
            </div>
          )}
        </header>

        {/* ── CONTENT AREA ───────────────────────────────── */}
        <div className="dash-body">

          {/* ── IDLE WELCOME STATE ─────────────────────── */}
          {isIdle && (
            <div className="dash-welcome">
              <div className="dash-welcome-badge">
                <span className="dash-welcome-dot" />
                AI-Powered Lead Generation
              </div>
              <h2 className="dash-welcome-heading">
                {mode === "search"
                  ? "What are you selling today?"
                  : "Find leads from competitor audiences"}
              </h2>
              <p className="dash-welcome-sub">
                {mode === "search"
                  ? "Enter a keyword, pain point, or product niche. Our AI scans Reddit and surfaces people actively looking for what you sell."
                  : "Paste competitor or product URLs. We extract keywords from their content and find Reddit users looking for alternatives."}
              </p>

              {/* Inline search form — large format */}
              {mode === "search" ? (
                <form className="dash-search-form" onSubmit={handleSearch}>
                  <div className="dash-search-wrap">
                    <span className="dash-search-prefix">🔍</span>
                    <input
                      id="main-search-input"
                      className="dash-search-input"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="e.g. best CRM for small teams, alternatives to Notion…"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      id="main-search-btn"
                      type="submit"
                      className="dash-search-btn"
                      disabled={loading || !query.trim()}
                    >
                      {loading ? <span className="btn-spinner" /> : "Search →"}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="dash-discover-form" onSubmit={handleDiscover}>
                  <div className="dash-discover-wrap">
                    <textarea
                      id="discover-urls-input"
                      className="dash-discover-input"
                      value={urls}
                      onChange={e => setUrls(e.target.value)}
                      placeholder={"Enter up to 5 competitor/product URLs:\nhttps://notion.so\nhttps://coda.io"}
                      rows={4}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      id="discover-submit-btn"
                      type="submit"
                      className="dash-search-btn"
                      disabled={loading || !urls.trim()}
                      style={{ alignSelf: "flex-end" }}
                    >
                      {loading ? <span className="btn-spinner" /> : "Discover Leads →"}
                    </button>
                  </div>
                </form>
              )}

              {/* Mode toggle cards */}
              <div className="dash-mode-cards">
                <div
                  className={`dash-mode-card ${mode === "search" ? "dash-mode-card-active" : ""}`}
                  onClick={() => setMode("search")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setMode("search")}
                >
                  <div className="dash-mode-card-icon">🔍</div>
                  <div>
                    <div className="dash-mode-card-title">Search Reddit</div>
                    <div className="dash-mode-card-desc">Enter a keyword and AI finds high-intent Reddit posts matching your niche.</div>
                  </div>
                </div>
                <div
                  className={`dash-mode-card ${mode === "discover" ? "dash-mode-card-active" : ""}`}
                  onClick={() => setMode("discover")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setMode("discover")}
                >
                  <div className="dash-mode-card-icon">🌐</div>
                  <div>
                    <div className="dash-mode-card-title">Discover from URLs</div>
                    <div className="dash-mode-card-desc">Paste competitor URLs — we extract keywords and surface their audience on Reddit.</div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="dash-stat-row">
                <div className="dash-stat-item"><span className="dash-stat-num">10k+</span><span className="dash-stat-lbl">Posts analyzed daily</span></div>
                <div className="dash-stat-div" />
                <div className="dash-stat-item"><span className="dash-stat-num">94%</span><span className="dash-stat-lbl">AI accuracy</span></div>
                <div className="dash-stat-div" />
                <div className="dash-stat-item"><span className="dash-stat-num">&lt;3 min</span><span className="dash-stat-lbl">To first lead</span></div>
              </div>
            </div>
          )}

          {/* ── COMPACT SEARCH BAR (after search, non-idle) ── */}
          {!isIdle && !activeSessionMeta && (
            <div className="dash-compact-search">
              {mode === "search" ? (
                <form className="dash-search-form" onSubmit={handleSearch}>
                  <div className="dash-search-wrap compact">
                    <span className="dash-search-prefix">🔍</span>
                    <input
                      className="dash-search-input"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search a new keyword…"
                      disabled={loading}
                    />
                    <button type="submit" className="dash-search-btn" disabled={loading || !query.trim()}>
                      {loading ? <span className="btn-spinner" /> : "Search →"}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="dash-discover-form" onSubmit={handleDiscover}>
                  <div className="dash-search-wrap compact">
                    <span className="dash-search-prefix">🌐</span>
                    <input
                      className="dash-search-input"
                      value={urls}
                      onChange={e => setUrls(e.target.value)}
                      placeholder="Paste competitor URL and press Discover…"
                      disabled={loading}
                    />
                    <button type="submit" className="dash-search-btn" disabled={loading || !urls.trim()}>
                      {loading ? <span className="btn-spinner" /> : "Discover →"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── LOADING STATE ───────────────────────────── */}
          {loading && (
            <div className="dash-loading-state">
              <div className="dash-loading-spinner" />
              <div className="dash-loading-text">{progressMsg || "AI is analyzing Reddit posts…"}</div>
              {progressMsg && (
                <div className="progress-bar-wrap" style={{ maxWidth: 400, width: "100%" }}>
                  <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                </div>
              )}
            </div>
          )}

          {/* ── ERROR ───────────────────────────────────── */}
          {error && (
            <div className="error-msg" style={{ margin: "0 0 16px" }}>⚠ {error}</div>
          )}

          {/* ── RESULTS ─────────────────────────────────── */}
          {!loading && (hasResults || activeSessionMeta) && (
            <Results posts={posts} info={info} sessionMeta={activeSessionMeta} />
          )}
        </div>
      </main>
    </div>
  );
}
