import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import { fetchLeads, discoverLeads, checkJobStatus } from "./services/api";
import { getSession, loginWithGoogle, logout } from "./auth/authService";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("search");
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [progressMsg, setProgressMsg] = useState("");

  //  Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      const session = await getSession();

      if (session) {
        localStorage.setItem("token", session.access_token);
        setUser(session.user);
      }
    };

    initAuth();
  }, []);

  //  Search handler (protected)
  const handleSearch = async (query) => {
    if (!user) {
      alert("Please login first");
      return;
    }

    setError("");
    setLoading(true);
    const response = await fetchLeads(query);
    setLoading(false);

    if (!response.success) {
      setError(response.message || "Unable to fetch leads");
      setPosts([]);
      setInfo(null);
      return;
    }

    setPosts(response.data || []);
    setInfo({
      source: response.source,
      count: response.count,
      keywords: response.keywords,
      category: response.category,
      painPoints: response.painPoints
    });
  };

  const handleDiscover = async (urls) => {
    setError("");
    setLoading(true);
    setProgressMsg("Starting background job...");
    setPosts([]);
    setInfo(null);
    
    const response = await discoverLeads(urls);

    if (!response.success || !response.jobId) {
      setLoading(false);
      setProgressMsg("");
      setError(response.message || "Unable to start discovery job");
      return;
    }

    const jobId = response.jobId;

    // Polling function
    const pollStatus = async () => {
      const statusRes = await checkJobStatus(jobId);
      
      if (!statusRes.success) {
        setLoading(false);
        setProgressMsg("");
        setError(statusRes.message || "Error checking job status");
        return;
      }

      if (statusRes.status === 'completed') {
        setLoading(false);
        setProgressMsg("");
        setPosts(statusRes.result?.data || []);
        setInfo({
          source: "discover",
          count: statusRes.result?.count || 0,
          keywords: statusRes.result?.keywords || [],
          category: statusRes.result?.category || "",
          painPoints: statusRes.result?.painPoints || []
        });
        return;
      }

      if (statusRes.status === 'failed') {
        setLoading(false);
        setProgressMsg("");
        setError(statusRes.message || "Background job failed");
        return;
      }

      // Update progress message and keep polling
      setProgressMsg(`${statusRes.progress}% - ${statusRes.message}`);
      setTimeout(pollStatus, 2000);
    };

    pollStatus();
  };

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <h1>Reddit Lead Finder</h1>

        {user ? (
          <button
            onClick={logout}
            style={{ padding: "10px 15px", cursor: "pointer" }}
          >
            Logout
          </button>
        ) : (
          <button
            onClick={loginWithGoogle}
            style={{ padding: "10px 15px", cursor: "pointer" }}
          >
            Continue with Google
          </button>
        )}
      </header>

      {user && (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            <button
              onClick={() => setMode("search")}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                background: mode === "search" ? "#0b5fff" : "#f0f0f0",
                color: mode === "search" ? "#fff" : "#000",
                border: "none",
                borderRadius: "8px"
              }}
            >
              Search Reddit
            </button>
            <button
              onClick={() => setMode("discover")}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                background: mode === "discover" ? "#0b5fff" : "#f0f0f0",
                color: mode === "discover" ? "#fff" : "#000",
                border: "none",
                borderRadius: "8px"
              }}
            >
              Discover from URLs
            </button>
          </div>

          <SearchBar
            mode={mode}
            onSearch={mode === "search" ? handleSearch : handleDiscover}
          />

          {error && <p style={{ color: "#c00", marginTop: "15px" }}>{error}</p>}
          {loading && <p style={{ marginTop: "15px", fontWeight: "bold", color: "#0b5fff" }}>{progressMsg || "Loading..."}</p>}

          <Results posts={posts} info={info} />
        </>
      )}

    </div>
  );
}

export default App;