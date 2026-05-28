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

// Email Login
export const loginWithEmail = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

// Email Sign Up
export const signUpWithEmail = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
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