import { useState } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import { fetchLeads } from "./services/api";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setLoading(true);
    const data = await fetchLeads(query);
    setPosts(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>

      <h1>🔥 Reddit Lead Finder</h1>

      <SearchBar onSearch={handleSearch} />

      {loading && <p>Loading...</p>}

      <Results posts={posts} />

    </div>
  );
}

export default App;