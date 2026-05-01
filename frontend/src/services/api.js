const API_URL = "http://localhost:5000";

export const fetchLeads = async (query) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_URL}/reddit/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const json = await res.json();

    return json.data || [];

  } catch (err) {
    console.error("[API ERROR]:", err.message);
    return [];
  }
};