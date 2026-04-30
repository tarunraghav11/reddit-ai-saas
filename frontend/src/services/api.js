import axios from "axios";

const API_URL = "http://localhost:5000";

export const fetchLeads = async (query) => {
  try {
    const res = await axios.get(`${API_URL}/reddit/search`, {
      params: { query }
    });

    return res.data.data;

  } catch (err) {
    console.error("[API] Error:", err.message);
    return [];
  }
};