import { useState } from "react";

export default function SearchBar({ mode = "search", onSearch, disabled = false }) {
  const [query, setQuery] = useState("");
  const [urls, setUrls]   = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (mode === "discover") {
      const list = urls
        .split(/\r?\n|,/)
        .map((u) => u.trim())
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
        <div className="search-form">
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. best CRM for small teams, alternatives to Notion…"
            disabled={disabled}
          />
          <button type="submit" className="search-btn" disabled={disabled || !query.trim()}>
            Search →
          </button>
        </div>
      ) : (
        <>
          <textarea
            className="search-input"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Enter up to 5 competitor/product URLs, one per line or comma separated"
            rows={5}
            style={{ resize: "vertical", minHeight: "130px", lineHeight: 1.6 }}
            disabled={disabled}
          />
          <button
            type="submit"
            className="search-btn"
            style={{ alignSelf: "flex-start" }}
            disabled={disabled || !urls.trim()}
          >
            Discover Leads →
          </button>
        </>
      )}
    </form>
  );
}
