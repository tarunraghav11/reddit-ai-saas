import { useState } from "react";
import { createCheckoutSession } from "../services/api";

export default function BillingView({ user }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const rawPlan = user?.app_metadata?.plan || user?.user_metadata?.plan || "free";
  const activePlan = rawPlan.toLowerCase();

  const plans = [
    {
      name: "Free",
      key: "free",
      price: "$0",
      description: "Perfect for exploring LeadRadar and running casual searches.",
      features: [
        "3 daily searches",
        "1 daily URL lead discovery",
        "2 daily outreach reply drafts",
        "Pre-analyzed database skips",
      ],
      cta: "Current Plan",
      enabled: activePlan === "free",
    },
    {
      name: "Starter",
      key: "starter",
      price: "$9.99",
      period: "/month",
      description: "Best for freelancers and side-hustlers looking to build sales pipelines.",
      features: [
        "20 daily searches",
        "10 daily URL lead discoveries",
        "Groq-powered buyer intent scoring",
        "15 daily outreach reply drafts",
        "Priority cache skipping",
      ],
      cta: "Upgrade to Starter",
      enabled: activePlan === "starter",
    },
    {
      name: "Pro",
      key: "pro",
      price: "$39.99",
      period: "/month",
      description: "Designed for scaling startups, agencies, and high-volume sales teams.",
      features: [
        "100 daily searches",
        "50 daily URL lead discoveries",
        "100 daily outreach reply drafts",
        "Instant background scraping queues",
        "Priority premium customer support",
      ],
      cta: "Upgrade to Pro",
      enabled: activePlan === "pro",
    },
  ];

  const handleUpgrade = async (planKey) => {
    if (planKey === "free" || planKey === activePlan || loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createCheckoutSession(planKey);
      if (res.success && res.url) {
        // Redirect user to Stripe Hosted Checkout page
        window.location.href = res.url;
      } else {
        setErrorMsg(res.message || "Failed to start checkout. Please try again.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-view">
      <header className="billing-header">
        <h2 className="billing-title">Subscription & Quotas</h2>
        <p className="billing-subtitle">
          Manage your subscription plan, view limits, and unlock premium AI features.
        </p>
      </header>

      {errorMsg && (
        <div className="auth-alert error" style={{ maxWidth: "800px", margin: "0 auto 24px" }} role="alert">
          <span className="alert-icon">⚠️</span>
          <span className="alert-text">{errorMsg}</span>
        </div>
      )}

      {/* Plan Status Banner */}
      <div className="plan-status-card">
        <div className="status-badge-wrap">
          <span className="status-label">Active Plan</span>
          <span className={`status-badge ${activePlan}`}>
            {activePlan.toUpperCase()}
          </span>
        </div>
        <div className="status-desc">
          {activePlan === "free" && (
            <p>You are using a limited free account. Upgrade to Starter or Pro to unlock up to 100 daily searches, 50 discoveries, and 100 daily outreach drafts.</p>
          )}
          {activePlan === "starter" && (
            <p>Your Starter account is active! You have 20 searches, 10 discovery scrapers, and up to 15 outreach reply drafts daily.</p>
          )}
          {activePlan === "pro" && (
            <p>You are on our top Pro plan! All features are unlocked including 100 daily searches, 50 scrapers, and 100 daily AI outreach drafts.</p>
          )}
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="pricing-grid">
        {plans.map((plan) => {
          const isCurrent = activePlan === plan.key;
          const isDowngrade = activePlan === "pro" && plan.key === "starter";
          
          return (
            <div key={plan.key} className={`pricing-card ${isCurrent ? "current" : ""} ${plan.key}`}>
              {isCurrent && <span className="pricing-current-tag">ACTIVE</span>}
              
              <div className="pricing-card-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price-wrap">
                  <span className="plan-price">{plan.price}</span>
                  {plan.period && <span className="plan-period">{plan.period}</span>}
                </div>
                <p className="plan-desc">{plan.description}</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((feat, i) => (
                  <li key={i} className="plan-feat-item">
                    <span className="feat-check">✓</span>
                    <span className="feat-text">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`plan-btn ${isCurrent ? "current" : "upgrade"} ${loading ? "loading" : ""}`}
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrent || isDowngrade || plan.key === "free" || loading}
              >
                {loading && plan.key !== "free" && !isCurrent ? (
                  <span className="auth-spinner" />
                ) : isCurrent ? (
                  "Active Plan"
                ) : isDowngrade ? (
                  "Downgrade unavailable"
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
