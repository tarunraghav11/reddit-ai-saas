import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle, loginWithEmail, signUpWithEmail } from "../auth/authService";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email.trim(), password);
        if (error) throw error;
        
        // Supabase sends a confirmation email if configured, or auto-logins depending on project settings
        if (data?.user && data?.session) {
          navigate("/app");
        } else {
          setSuccessMsg("Registration successful! Check your email for a confirmation link.");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        const { error } = await loginWithEmail(email.trim(), password);
        if (error) throw error;
        navigate("/app");
      }
    } catch (err) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      const { error } = await loginWithGoogle();
      if (error) throw error;
    } catch (err) {
      setErrorMsg(err.message || "OAuth redirection failed.");
    }
  };

  return (
    <div className="auth-container">
      {/* Background Orbs */}
      <div className="auth-bg-orbs" aria-hidden="true">
        <div className="auth-orb orb-purple" />
        <div className="auth-orb orb-cyan" />
        <div className="auth-grid-pattern" />
      </div>

      <div className="auth-card">
        {/* Back link */}
        <Link to="/" className="auth-back-link">
          ← Back to Home
        </Link>

        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-logo" style={{ display: "inline-flex", alignItems: "center" }}>
            <svg viewBox="0 0 24 24" width="28" height="28" style={{ fill: "#a855f7" }}>
              <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.3-4.14 4.26 1c.02.99.83 1.77 1.83 1.77 1.02 0 1.85-.83 1.85-1.85 0-1.02-.83-1.85-1.85-1.85-.84 0-1.55.57-1.77 1.34L13.12 1.82C12.96 1.76 12.79 1.85 12.73 2l-1.5 4.76C8.78 6.85 6.54 7.5 4.9 8.5 4.33 7.74 3.43 7.26 2.47 7.26c-1.65 0-3 1.35-3 3 0 1.2.71 2.24 1.74 2.72-.08.38-.11.77-.11 1.16 0 3.86 4.43 7 9.9 7s9.9-3.14 9.9-7c0-.39-.03-.78-.11-1.16 1.03-.48 1.74-1.52 1.74-2.72zm-16.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 3c-1.8 1.8-5.2 1.8-7 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.4 1.4 4.2 1.4 5.6 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm.5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </span>
          <span className="auth-brand-name">LeadRadar</span>
        </div>

        <h2 className="auth-title">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p className="auth-subtitle">
          {isSignUp
            ? "Start finding high-intent leads on Reddit today"
            : "Sign in to access your dashboard and search history"}
        </p>

        {/* Success/Error Alerts */}
        {errorMsg && (
          <div className="auth-alert error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success" role="alert">
            <span className="alert-icon">✉️</span>
            <span className="alert-text">{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn-google-auth"
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.376 0-6.113-2.737-6.113-6.113s2.737-6.113 6.113-6.113c1.554 0 2.96.58 4.037 1.536l3.14-3.14C19.262 2.112 15.992 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c5.845 0 11.24-4.215 11.24-11.24 0-.756-.076-1.485-.22-2.195H12.24Z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span className="divider-line" />
          <span className="divider-text">or use email</span>
          <span className="divider-line" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-submit-auth"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : isSignUp ? (
              "Create Free Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="auth-footer">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                Get Started Free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
