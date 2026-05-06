const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {
      success: false,
      message: "Invalid JSON response from API",
      data: []
    };
  }
};

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

    const json = await safeJson(res);

    return {
      success: res.ok && json.success,
      ...json
    };
  } catch (err) {
    console.error("[API ERROR]:", err.message);
    return {
      success: false,
      message: err.message || "Unable to fetch leads",
      data: []
    };
  }
};

export const discoverLeads = async (urls) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/leads/discover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ urls })
    });

    const json = await safeJson(res);

    return {
      success: res.ok && json.success,
      ...json
    };
  } catch (err) {
    console.error("[API ERROR]:", err.message);
    return {
      success: false,
      message: err.message || "Unable to discover leads",
      data: []
    };
  }
};

export const checkJobStatus = async (jobId) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/leads/discover/${jobId}/status`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const json = await safeJson(res);
    return {
      success: res.ok && json.success,
      ...json
    };
  } catch (err) {
    console.error("[API ERROR]:", err.message);
    return {
      success: false,
      message: "Error checking job status"
    };
  }
};