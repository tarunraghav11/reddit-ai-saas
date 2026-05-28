const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return { success: false, message: "Invalid JSON response from API", data: [] };
  }
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Lead Search ────────────────────────────────────────────
export const fetchLeads = async (query) => {
  try {
    const res = await fetch(
      `${API_URL}/reddit/search?query=${encodeURIComponent(query)}`,
      { headers: authHeaders() }
    );
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] fetchLeads:", err.message);
    return { success: false, message: err.message || "Unable to fetch leads", data: [] };
  }
};

// ── Discover from URLs ─────────────────────────────────────
export const discoverLeads = async (urls) => {
  try {
    const res = await fetch(`${API_URL}/leads/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ urls }),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] discoverLeads:", err.message);
    return { success: false, message: err.message || "Unable to discover leads", data: [] };
  }
};

// ── Job Polling ────────────────────────────────────────────
export const checkJobStatus = async (jobId) => {
  try {
    const res = await fetch(`${API_URL}/leads/discover/${jobId}/status`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] checkJobStatus:", err.message);
    return { success: false, message: "Error checking job status" };
  }
};

// ── Lead History ───────────────────────────────────────────
export const getLeadHistory = async (page = 0) => {
  try {
    const res = await fetch(`${API_URL}/leads/history?page=${page}&limit=25`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] getLeadHistory:", err.message);
    return { success: false, data: [] };
  }
};

export const getSessionLeads = async (sessionId) => {
  try {
    const res = await fetch(`${API_URL}/leads/history/${sessionId}`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] getSessionLeads:", err.message);
    return { success: false, data: [] };
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const res = await fetch(`${API_URL}/leads/history/${sessionId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] deleteSession:", err.message);
    return { success: false };
  }
};

export const generateReply = async ({ title, pain, subreddit, reason }) => {
  try {
    const res = await fetch(`${API_URL}/leads/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, pain, subreddit, reason }),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] generateReply:", err.message);
    return { success: false, message: err.message || "Failed to generate replies" };
  }
};

// ── Stripe Billing ──────────────────────────────────────────
export const createCheckoutSession = async (planName) => {
  try {
    const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ planName }),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] createCheckoutSession:", err.message);
    return { success: false, message: err.message || "Failed to create checkout session" };
  }
};

export const verifyCheckoutSession = async (sessionId) => {
  try {
    const res = await fetch(`${API_URL}/payments/verify-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sessionId }),
    });
    const json = await safeJson(res);
    return { success: res.ok && json.success, ...json };
  } catch (err) {
    console.error("[API] verifyCheckoutSession:", err.message);
    return { success: false, message: err.message || "Failed to verify payment session" };
  }
};