import { supabase } from "./supabaseClient";

// Google Login — redirect to /app after OAuth
export const loginWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/app`,
    },
  });
};

// Get current session
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// Logout
export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("token");
};