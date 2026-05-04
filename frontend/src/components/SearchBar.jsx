import { useState } from "react";

export default function SearchBar({ mode = "search", onSearch }) {
  const [query, setQuery] = useState("");
  const [urls, setUrls] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "discover") {
      const list = urls
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5);

      if (list.length === 0) return;
      onSearch(list);
      return;
    }

    if (!query.trim()) return;
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {mode === "search" ? (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems (e.g. best CRM tools)"
          style={{ padding: "10px" }}
        />
      ) : (
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="Enter up to 5 URLs, one per line or comma separated"
          rows={5}
          style={{ padding: "10px", minHeight: "140px" }}
        />
      )}

      <button style={{ padding: "10px", width: "160px" }}>
        {mode === "search" ? "Search Reddit" : "Discover Leads"}
      </button>
    </form>
  );
}
