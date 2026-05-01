import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import { fetchLeads } from "./services/api";
import { getSession, loginWithGoogle } from "./auth/authService";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

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

    setLoading(true);
    const data = await fetchLeads(query);
    setPosts(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>

      <h1>  Reddit Lead Finder</h1>

      {/*  Login Button */}
      {!user && (
        <button
          onClick={loginWithGoogle}
          style={{
            padding: "10px 15px",
            marginBottom: "20px",
            cursor: "pointer"
          }}
        >
          Continue with Google
        </button>
      )}

      {/*  Show search ONLY if logged in */}
      {user && (
        <>
          <SearchBar onSearch={handleSearch} />

          {loading && <p>Loading...</p>}

          <Results posts={posts} />
        </>
      )}

    </div>
  );
}

export default App;