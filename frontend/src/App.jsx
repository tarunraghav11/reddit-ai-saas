import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import LandingPage from "./pages/LandingPage";
import MainApp from "./pages/MainApp";
import AuthPage from "./pages/AuthPage";
import { supabase } from "./auth/supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem("token", session.access_token);
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    // Listen for auth state changes (handles OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          localStorage.setItem("token", session.access_token);
          setUser(session.user);
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div className="loader-pulse" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage user={user} />} />
      <Route
        path="/auth"
        element={!user ? <AuthPage /> : <Navigate to="/app" replace />}
      />
      <Route
        path="/app"
        element={user ? <MainApp user={user} /> : <Navigate to="/auth" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;