import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import { fetchLeads, discoverLeads } from "./services/api";
import { getSession, loginWithGoogle, logout } from "./auth/authService";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("search");
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

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
    const response = await discoverLeads(urls);
    setLoading(false);

    if (!response.success) {
      setError(response.message || "Unable to discover leads");
      setPosts([]);
      setInfo(null);
      return;
    }

    setPosts(response.data || []);
    setInfo({
      source: "discover",
      count: response.count,
      keywords: response.keywords,
      category: response.category,
      painPoints: response.painPoints
    });
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
          {loading && <p style={{ marginTop: "15px" }}>Loading...</p>}

          <Results posts={posts} info={info} />
        </>
      )}

    </div>
  );
}

export default App;