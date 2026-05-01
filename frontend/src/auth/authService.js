import { supabase } from "./supabaseClient";

//  Google Login
export const loginWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: "google"
  });
};

//  Get current session
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// 🚪 Logout
export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("token");
};