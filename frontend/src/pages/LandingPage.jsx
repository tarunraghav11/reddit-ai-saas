import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle } from "../auth/authService";

export default function LandingPage({ user }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = async () => {
    if (user) { navigate("/app"); } else { await loginWithGoogle(); }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const features = [
    { icon: "⚡", title: "Real-time Results", desc: "Fresh Reddit data on every search — always the hottest conversations happening right now." },
    { icon: "🧠", title: "AI Intent Scoring", desc: "Scores buyer intent 0–100 using Groq AI so you focus on the highest-value leads first." },
    { icon: "🗂️", title: "Persistent History", desc: "Every search is saved automatically. Come back anytime to revisit leads from past sessions." },
    { icon: "🌐", title: "Competitor Discovery", desc: "Paste a competitor URL and uncover audiences actively searching for alternatives." },
    { icon: "💰", title: "Pain Point Extraction", desc: "AI pulls exact pain points from each post — perfect for hyper-personalized outreach." },
    { icon: "🔒", title: "Secure & Private", desc: "Your searches are private to your account. Built on enterprise-grade Supabase infrastructure." },
  ];

  const steps = [
    { num: "01", icon: "🔍", title: "Enter Your Niche", desc: "Type your product or service keyword. LeadRadar targets the right subreddits automatically.", color: "#6c63ff" },
    { num: "02", icon: "🤖", title: "AI Scans Reddit", desc: "Our Groq-powered AI reads thousands of posts, classifies intent, and scores buying signals in real time.", color: "#06b6d4" },
    { num: "03", icon: "🎯", title: "Get Ranked Leads", desc: "Receive a curated list of high-intent prospects with pain points, opportunity scores, and direct links.", color: "#22c55e" },
  ];

  const compareRows = [
    ["Time to find 5 leads", "~3 minutes", "2–3 hours"],
    ["Intent scoring", "✅ AI-powered", "❌ Guesswork"],
    ["Pain point extraction", "✅ Automatic", "❌ Manual notes"],
    ["Search history", "✅ Always saved", "❌ Gone after tab close"],
    ["Competitor discovery", "✅ Built-in", "❌ Not possible"],
    ["Scale", "✅ 1000s of posts", "❌ Limited by time"],
  ];

  return (
    <div className="landing-root">

      {/* ── NAVBAR ─────────────────────────────────── */}
      <header className={`landing-nav${scrolled ? " nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="nav-logo-icon">🎯</span>
            <span className="nav-logo-text">LeadRadar</span>
          </div>

          <nav className="nav-links" aria-label="Main navigation">
            <button id="nav-how" onClick={() => scrollTo("how-it-works")}>How it Works</button>
            <button id="nav-why" onClick={() => scrollTo("why-us")}>Why LeadRadar</button>
            <button id="nav-pricing" onClick={() => scrollTo("pricing-teaser")}>Pricing</button>
          </nav>

          <div className="nav-actions">
            {user ? (
              <button id="nav-open-app" className="nav-btn-primary" onClick={() => navigate("/app")}>Open App →</button>
            ) : (
              <>
                <button id="nav-signin" className="nav-btn-ghost" onClick={handleCTA}>Sign In</button>
                <button id="nav-get-started" className="nav-btn-primary" onClick={handleCTA}>Get Started Free</button>
              </>
            )}
          </div>

          <button className="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu" onClick={() => setMenuOpen((o) => !o)}>
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          </button>
        </div>

        {menuOpen && (
          <div className="nav-mobile-menu">
            <button onClick={() => scrollTo("how-it-works")}>How it Works</button>
            <button onClick={() => scrollTo("why-us")}>Why LeadRadar</button>
            <button onClick={() => scrollTo("pricing-teaser")}>Pricing</button>
            <button className="nav-btn-primary full-w" id="mobile-cta" onClick={handleCTA}>
              {user ? "Open App →" : "Get Started Free"}
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
          <div className="hero-orb orb-3" />
          <div className="hero-grid-pattern" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI-Powered Reddit Lead Generation
          </div>

          <h1 className="hero-title">
            Find High-Intent<br />
            <span className="gradient-text">Reddit Leads</span><br />
            Before Your Competitors Do
          </h1>

          <p className="hero-sub">
            Stop scrolling Reddit for hours. Our AI scans thousands of posts, scores buying intent, and surfaces people who <em>need</em> what you sell — right now.
          </p>

          <div className="hero-actions">
            <button id="hero-cta-primary" className="hero-btn-primary" onClick={handleCTA}>
              {user ? "Open Dashboard →" : "Start Finding Leads Free"}
            </button>
            <button id="hero-cta-secondary" className="hero-btn-ghost" onClick={() => scrollTo("how-it-works")}>
              See How it Works ↓
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat"><span className="stat-num">10k+</span><span className="stat-label">Posts analyzed daily</span></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><span className="stat-num">94%</span><span className="stat-label">AI accuracy score</span></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><span className="stat-num">3 min</span><span className="stat-label">Time to first lead</span></div>
          </div>
        </div>

        {/* Browser mockup */}
        <div className="hero-mockup" aria-hidden="true">
          <div className="mock-browser">
            <div className="mock-titlebar">
              <div className="mock-dots">
                <span className="mock-dot" style={{ background: "#ff5f57" }} />
                <span className="mock-dot" style={{ background: "#febc2e" }} />
                <span className="mock-dot" style={{ background: "#28c840" }} />
              </div>
              <div className="mock-url-bar">leadradar.app</div>
            </div>
            <div className="mock-content">
              <div className="mock-search-bar">
                <span className="mock-search-icon">🔍</span>
                <span className="mock-search-text">SaaS email marketing tool</span>
                <span className="mock-search-btn">Search</span>
              </div>
              <div className="mock-leads-list">
                {[
                  { intent: "HIGH", title: "Looking for email tool that actually delivers...", sub: "r/entrepreneur · 234 ↑", score: 95, delay: "0s" },
                  { intent: "HIGH", title: "Mailchimp destroying my open rates, need alternative", sub: "r/smallbusiness · 89 ↑", score: 88, delay: "0.15s" },
                  { intent: "MEDIUM", title: "Best email automation for SaaS founders 2025?", sub: "r/SaaS · 156 ↑", score: 74, delay: "0.3s" },
                ].map((lead, i) => (
                  <div key={i} className="mock-lead" style={{ animationDelay: lead.delay }}>
                    <span className={`mock-intent-badge ${lead.intent}`}>{lead.intent}</span>
                    <div className="mock-lead-body">
                      <div className="mock-lead-title">{lead.title}</div>
                      <div className="mock-lead-sub">{lead.sub}</div>
                    </div>
                    <div className="mock-score-ring" style={{ "--score-pct": `${lead.score}%` }}>
                      <span>{lead.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────── */}
      <section id="how-it-works" className="section-how">
        <div className="section-container">
          <div className="section-eyebrow">Simple Process</div>
          <h2 className="section-heading">From keyword to lead in minutes</h2>
          <p className="section-desc">Three steps. No setup. No credit card required to get started.</p>

          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step-card" style={{ "--step-clr": step.color }}>
                <div className="step-number">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {i < steps.length - 1 && <div className="step-arrow" aria-hidden="true">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY LEADRADAR ──────────────────────────── */}
      <section id="why-us" className="section-why">
        <div className="section-container">
          <div className="section-eyebrow">Why LeadRadar</div>
          <h2 className="section-heading">Stop wasting time on manual prospecting</h2>
          <p className="section-desc">LeadRadar gives you an unfair advantage over competitors still browsing Reddit manually.</p>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="compare-wrap">
            <h3 className="compare-heading">LeadRadar vs Manual Reddit Search</h3>
            <div className="compare-table" role="table" aria-label="Comparison table">
              <div className="compare-header" role="row">
                <div role="columnheader">Feature</div>
                <div className="col-ours" role="columnheader">🎯 LeadRadar</div>
                <div className="col-manual" role="columnheader">Manual Search</div>
              </div>
              {compareRows.map(([feat, ours, manual], i) => (
                <div key={i} className="compare-row" role="row">
                  <div role="cell">{feat}</div>
                  <div className="col-ours" role="cell">{ours}</div>
                  <div className="col-manual" role="cell">{manual}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ─────────────────────────── */}
      <section id="pricing-teaser" className="section-pricing-teaser">
        <div className="section-container">
          <div className="section-eyebrow">Pricing</div>
          <h2 className="section-heading">Start free. Upgrade when you're ready.</h2>
          <p className="section-desc">No contracts. No hidden fees. Cancel anytime.</p>

          <div className="pricing-cards">
            {[
              { name: "Free", price: "$0", searches: "3 searches/day", discovers: "1 discover/day", cta: "Get Started Free", highlight: false },
              { name: "Starter", price: "$19/mo", searches: "20 searches/day", discovers: "10 discovers/day", cta: "Upgrade to Starter", highlight: true },
              { name: "Pro", price: "$49/mo", searches: "100 searches/day", discovers: "50 discovers/day", cta: "Upgrade to Pro", highlight: false },
            ].map((plan, i) => (
              <div key={i} className={`pricing-card${plan.highlight ? " pricing-card-highlight" : ""}`}>
                {plan.highlight && <div className="pricing-popular-badge">Most Popular</div>}
                <div className="pricing-plan-name">{plan.name}</div>
                <div className="pricing-price">{plan.price}</div>
                <ul className="pricing-features">
                  <li>✓ {plan.searches}</li>
                  <li>✓ {plan.discovers}</li>
                  <li>✓ AI intent scoring</li>
                  <li>✓ Search history</li>
                  {i > 0 && <li>✓ Priority support</li>}
                </ul>
                <button
                  id={`pricing-cta-${plan.name.toLowerCase()}`}
                  className={`pricing-cta-btn${plan.highlight ? " primary" : ""}`}
                  onClick={handleCTA}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────── */}
      <section className="section-cta">
        <div className="cta-orb" aria-hidden="true" />
        <div className="section-container cta-inner">
          <h2 className="cta-title">Ready to find your next customer?</h2>
          <p className="cta-sub">Join founders and marketers who use LeadRadar to find high-intent Reddit leads every day. Free to start — no card required.</p>
          <button id="cta-final" className="hero-btn-primary large" onClick={handleCTA}>
            {user ? "Go to Dashboard →" : "Start Finding Leads for Free →"}
          </button>
          <p className="cta-note">Free plan includes 3 searches/day. No credit card needed.</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-icon">🎯</span>
            <span className="nav-logo-text">LeadRadar</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <button onClick={() => scrollTo("how-it-works")}>How it Works</button>
            <button onClick={() => scrollTo("why-us")}>Why LeadRadar</button>
            <button onClick={() => scrollTo("pricing-teaser")}>Pricing</button>
          </nav>
          <p className="footer-copy">© {new Date().getFullYear()} LeadRadar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
