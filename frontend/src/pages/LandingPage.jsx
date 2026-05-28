import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage({ user }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/auth");
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const features = [
    {
      icon: "⚡",
      title: "Real-time Reddit Scanning",
      desc: "Live, fresh Reddit data matching your exact target niche. Capture buying signals the very minute they happen.",
    },
    {
      icon: "🧠",
      title: "AI Buyer Intent Scoring",
      desc: "Analyzes post context using Groq AI and scores buyer intent 0-100, saving you hours of manual scrolling and guesswork.",
    },
    {
      icon: "✉️",
      title: "Contextual Outreach Drafts",
      desc: "Instantly crafts 2 hyper-personalized reply drafts tailored to the specific pain point and subreddit tone in one click.",
    },
    {
      icon: "🌐",
      title: "Competitor URL Scraper",
      desc: "Paste any competitor homepage URL. We automatically extract their target keywords and surface their audience on Reddit.",
    },
    {
      icon: "💸",
      title: "Pain Point Extraction",
      desc: "Automatically extracts exact product gaps, budget constraints, and feature frustrations directly from Reddit posts.",
    },
    {
      icon: "🗂️",
      title: "Persistent Search History",
      desc: "All your search sessions, categories, and leads are saved automatically. Never lose a high-value prospect again.",
    },
  ];

  const steps = [
    {
      num: "01",
      icon: "🔍",
      title: "Define Niche Keywords",
      desc: "Type your product domain or target keywords. LeadRadar targets highly relevant niche subreddits automatically.",
      color: "#6c63ff",
    },
    {
      num: "02",
      icon: "🤖",
      title: "AI Audits Post Intent",
      desc: "Our Groq-powered AI reads the text, classifies buyer intent, and extracts exact user frustrations in seconds.",
      color: "#06b6d4",
    },
    {
      num: "03",
      icon: "🎯",
      title: "Deploy outreach drafts",
      desc: "Copy context-aware outreach replies and direct-link to the Reddit post to close high-intent sales pipelines immediately.",
      color: "#22c55e",
    },
  ];

  const testimonials = [
    {
      name: "Siddharth Mehta",
      role: "Founder, MailPush SaaS",
      avatar: "S",
      quote: "LeadRadar completely replaced my cold emailing workflow. I found 12 high-paying SaaS customers in my first week just by replying to hot threads on r/startup. The AI intent scoring is scarily accurate!",
      stars: "★★★★★",
    },
    {
      name: "Sarah Jenkins",
      role: "Growth Marketer, FlowDoc",
      avatar: "J",
      quote: "Scraping competitor URLs to find Reddit keywords is a cheat code. I dropped our competitor's landing page, found 5 niche keywords, and got 40 high-quality leads in under 10 minutes. Incredible utility!",
      stars: "★★★★★",
    },
  ];

  const faqs = [
    {
      q: "How does the AI intent scoring work?",
      a: "Our system pulls live Reddit posts based on your keywords and passes them to our Groq-powered AI engine. The model analyzes the user's title, body, and subreddit parameters to detect purchase urgency, frustration with competitors, or direct requests for recommendations, scoring them from 0 (low signal) to 100 (ready to buy).",
    },
    {
      q: "Can I use LeadRadar completely for free?",
      a: "Yes! Our Free plan is free forever and includes 3 daily searches and 1 URL competitor discover scan. No credit card is required to sign up or test your limits.",
    },
    {
      q: "What is the Outreach Reply Drafts Generator?",
      a: "Available on our Starter and Pro tiers, this feature uses context-aware LLMs to analyze the exact pain points extracted from a Reddit post. It then crafts 2 highly personalized, non-spammy response drafts designed to help and subtly pitch your product according to the subreddit rules.",
    },
    {
      q: "How do I connect my Stripe subscription?",
      a: "Stripe handles all of our billing. You can subscribe securely inside the Billing & Quotas tab of your dashboard. Stripe Test Mode is currently enabled, allowing you to fully test upgrades using mock test card details completely for free.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      desc: "Perfect for exploring niche keywords and validating ideas.",
      searches: "3 searches/day",
      discovers: "1 discover/day",
      outreach: "2 outreach drafts/day",
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Starter",
      price: "$9.99",
      desc: "For freelancers and founders building consistent pipelines.",
      searches: "20 searches/day",
      discovers: "10 discovers/day",
      outreach: "15 outreach drafts/day",
      cta: "Upgrade to Starter",
      highlight: true,
    },
    {
      name: "Pro",
      price: "$39.99",
      desc: "For growth agencies, startups, and outbound sales teams.",
      searches: "100 searches/day",
      discovers: "50 discovers/day",
      outreach: "100 outreach drafts/day",
      cta: "Upgrade to Pro",
      highlight: false,
    },
  ];

  return (
    <div className="landing-root">
      {/* ── NAVBAR ─────────────────────────────────── */}
      <header className={`landing-nav${scrolled ? " nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <div
            className="nav-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span className="nav-logo-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              <svg viewBox="0 0 24 24" width="24" height="24" style={{ fill: "#a855f7" }}>
                <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.3-4.14 4.26 1c.02.99.83 1.77 1.83 1.77 1.02 0 1.85-.83 1.85-1.85 0-1.02-.83-1.85-1.85-1.85-.84 0-1.55.57-1.77 1.34L13.12 1.82C12.96 1.76 12.79 1.85 12.73 2l-1.5 4.76C8.78 6.85 6.54 7.5 4.9 8.5 4.33 7.74 3.43 7.26 2.47 7.26c-1.65 0-3 1.35-3 3 0 1.2.71 2.24 1.74 2.72-.08.38-.11.77-.11 1.16 0 3.86 4.43 7 9.9 7s9.9-3.14 9.9-7c0-.39-.03-.78-.11-1.16 1.03-.48 1.74-1.52 1.74-2.72zm-16.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 3c-1.8 1.8-5.2 1.8-7 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.4 1.4 4.2 1.4 5.6 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm.5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </span>
            <span className="nav-logo-text">LeadRadar</span>
          </div>

          <nav className="nav-links" aria-label="Main navigation">
            <button onClick={() => scrollTo("how-it-works")}>How it Works</button>
            <button onClick={() => scrollTo("why-us")}>Why LeadRadar</button>
            <button onClick={() => scrollTo("testimonials")}>Testimonials</button>
            <button onClick={() => scrollTo("pricing-teaser")}>Pricing</button>
            <button onClick={() => scrollTo("faqs")}>FAQs</button>
          </nav>

          <div className="nav-actions">
            {user ? (
              <button
                className="nav-btn-primary"
                onClick={() => navigate("/app")}
              >
                Dashboard →
              </button>
            ) : (
              <>
                <button className="nav-btn-ghost" onClick={handleCTA}>
                  Sign In
                </button>
                <button className="nav-btn-primary" onClick={handleCTA}>
                  Get Started Free
                </button>
              </>
            )}
          </div>

          <button
            className="nav-hamburger"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          </button>
        </div>

        {menuOpen && (
          <div className="nav-mobile-menu">
            <button onClick={() => scrollTo("how-it-works")}>How it Works</button>
            <button onClick={() => scrollTo("why-us")}>Why LeadRadar</button>
            <button onClick={() => scrollTo("testimonials")}>Testimonials</button>
            <button onClick={() => scrollTo("pricing-teaser")}>Pricing</button>
            <button onClick={() => scrollTo("faqs")}>FAQs</button>
            <button className="nav-btn-primary full-w" onClick={handleCTA}>
              {user ? "Dashboard →" : "Get Started Free"}
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
            AI-Powered Reddit Lead Acquisition
          </div>

          <h1 className="hero-title">
            Acquire High-Intent<br />
            <span className="gradient-text">Reddit Leads</span><br />
            In Real Time
          </h1>

          <p className="hero-sub">
            Stop digging through Reddit manually. Our Groq-powered AI monitors thousands of posts daily, extracts specific pain points, and filters the top 1% highest-intent buyers for your business.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={handleCTA}>
              {user ? "Open Dashboard →" : "Start Finding Leads Free"}
            </button>
            <button
              className="hero-btn-ghost"
              onClick={() => scrollTo("how-it-works")}
            >
              Learn More ↓
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-num">10k+</span>
              <span className="stat-label">Posts analyzed daily</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="stat-num">94%</span>
              <span className="stat-label">AI intent accuracy</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="stat-num">3 min</span>
              <span className="stat-label">Time to first sales lead</span>
            </div>
          </div>
        </div>

        {/* Mock Browser Graphics */}
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
                <span className="mock-search-text">SaaS email marketing tool alternative</span>
                <span className="mock-search-btn">Search</span>
              </div>
              <div className="mock-leads-list">
                {[
                  {
                    intent: "HIGH",
                    title: "Looking for email marketing tool that actually delivers...",
                    sub: "r/entrepreneur · 94% Intent Score",
                    score: 94,
                    delay: "0s",
                  },
                  {
                    intent: "HIGH",
                    title: "Mailchimp pricing is killing us, any self-hosted alternatives?",
                    sub: "r/smallbusiness · 88% Intent Score",
                    score: 88,
                    delay: "0.15s",
                  },
                  {
                    intent: "MEDIUM",
                    title: "Best email automation suite for bootstrap SaaS founders?",
                    sub: "r/SaaS · 72% Intent Score",
                    score: 72,
                    delay: "0.3s",
                  },
                ].map((lead, i) => (
                  <div
                    key={i}
                    className="mock-lead"
                    style={{ animationDelay: lead.delay }}
                  >
                    <span className={`mock-intent-badge ${lead.intent}`}>
                      {lead.intent}
                    </span>
                    <div className="mock-lead-body">
                      <div className="mock-lead-title">{lead.title}</div>
                      <div className="mock-lead-sub">{lead.sub}</div>
                    </div>
                    <div
                      className="mock-score-ring"
                      style={{ "--score-pct": `${lead.score}%` }}
                    >
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
          <div className="section-eyebrow">Smart Pipeline</div>
          <h2 className="section-heading">Identify, qualify, and draft outreach in seconds</h2>
          <p className="section-desc">
            LeadRadar operates in three lightning-fast steps, taking you from raw Reddit text to a highly custom pitch draft.
          </p>

          <div className="steps-grid">
            {steps.map((step, i) => (
              <div
                key={i}
                className="step-card"
                style={{ "--step-clr": step.color }}
              >
                <div className="step-number">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="step-arrow" aria-hidden="true">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY LEADRADAR ──────────────────────────── */}
      <section id="why-us" className="section-why">
        <div className="section-container">
          <div className="section-eyebrow">Core Features</div>
          <h2 className="section-heading">A complete toolset built for sales acquisition</h2>
          <p className="section-desc">
            We built LeadRadar to solve manual prospecting pain. Here is how we give you the growth edge:
          </p>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────── */}
      <section id="testimonials" className="section-testimonials">
        <div className="section-container">
          <div className="section-eyebrow">Social Proof</div>
          <h2 className="section-heading">Loved by founders and outbound teams</h2>
          <p className="section-desc">
            See how developers and builders are utilizing LeadRadar to close high-ticket pipelines.
          </p>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="test-stars">{t.stars}</div>
                <p className="test-quote">"{t.quote}"</p>
                <div className="test-user">
                  <div className="test-avatar">{t.avatar}</div>
                  <div className="test-info">
                    <div className="test-name">{t.name}</div>
                    <div className="test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ─────────────────────────── */}
      <section id="pricing-teaser" className="section-pricing-teaser">
        <div className="section-container">
          <div className="section-eyebrow">Pricing Plans</div>
          <h2 className="section-heading">Transparent pricing for every stage</h2>
          <p className="section-desc">
            Start completely for free. Simple monthly plans tailored to your pipeline growth.
          </p>

          <div className="pricing-cards">
            {pricingPlans.map((plan, i) => {
              return (
                <div
                  key={i}
                  className={`pricing-card${plan.highlight ? " pricing-card-highlight" : ""}`}
                >
                  {plan.highlight && (
                    <div className="pricing-popular-badge">Most Popular</div>
                  )}
                  <div className="pricing-plan-name">{plan.name}</div>
                  <div className="pricing-price">
                    {plan.price}
                    <span className="price-period">/mo</span>
                  </div>
                  <p className="pricing-card-desc">{plan.desc}</p>
                  
                  <ul className="pricing-features">
                    <li>✓ {plan.searches}</li>
                    <li>✓ {plan.discovers}</li>
                    <li>✓ {plan.outreach}</li>
                    <li>✓ Live Groq AI intent scoring</li>
                    <li>✓ Interactive search histories</li>
                  </ul>
                  
                  <button
                    className={`pricing-cta-btn${plan.highlight ? " primary" : ""}`}
                    onClick={handleCTA}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQS SECTION ───────────────────────────── */}
      <section id="faqs" className="section-faqs">
        <div className="section-container">
          <div className="section-eyebrow">Answering Questions</div>
          <h2 className="section-heading">Frequently Asked Questions</h2>
          <p className="section-desc">
            Got questions about integrations, daily quotas, or Stripe payments? We have answers.
          </p>

          <div className="faqs-list">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`faq-item ${isOpen ? "open" : ""}`}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setOpenFaq(isOpen ? null : i)}
                >
                  <div className="faq-question">
                    <h4>{faq.q}</h4>
                    <span className="faq-toggle">{isOpen ? "−" : "+"}</span>
                  </div>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────── */}
      <section className="section-cta">
        <div className="cta-orb" aria-hidden="true" />
        <div className="section-container cta-inner">
          <h2 className="cta-title">Start acquiring customers today</h2>
          <p className="cta-sub">
            Join outbound builders and SaaS teams already using LeadRadar to identify high-intent Reddit prospects. Setup takes 30 seconds.
          </p>
          <button className="hero-btn-primary large" onClick={handleCTA}>
            {user ? "Go to Dashboard →" : "Start Finding Leads Free →"}
          </button>
          <p className="cta-note">
            Free plan includes 3 searches/day and 2 outreach reply drafts. No credit card required.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              <svg viewBox="0 0 24 24" width="24" height="24" style={{ fill: "#a855f7" }}>
                <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.3-4.14 4.26 1c.02.99.83 1.77 1.83 1.77 1.02 0 1.85-.83 1.85-1.85 0-1.02-.83-1.85-1.85-1.85-.84 0-1.55.57-1.77 1.34L13.12 1.82C12.96 1.76 12.79 1.85 12.73 2l-1.5 4.76C8.78 6.85 6.54 7.5 4.9 8.5 4.33 7.74 3.43 7.26 2.47 7.26c-1.65 0-3 1.35-3 3 0 1.2.71 2.24 1.74 2.72-.08.38-.11.77-.11 1.16 0 3.86 4.43 7 9.9 7s9.9-3.14 9.9-7c0-.39-.03-.78-.11-1.16 1.03-.48 1.74-1.52 1.74-2.72zm-16.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 3c-1.8 1.8-5.2 1.8-7 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.4 1.4 4.2 1.4 5.6 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm.5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </span>
            <span className="nav-logo-text">LeadRadar</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <button onClick={() => scrollTo("how-it-works")}>How it Works</button>
            <button onClick={() => scrollTo("why-us")}>Why LeadRadar</button>
            <button onClick={() => scrollTo("testimonials")}>Testimonials</button>
            <button onClick={() => scrollTo("pricing-teaser")}>Pricing</button>
            <button onClick={() => scrollTo("faqs")}>FAQs</button>
          </nav>
          <p className="footer-copy">
            © {new Date().getFullYear()} LeadRadar. All rights reserved. Built with Supabase & Stripe.
          </p>
        </div>
      </footer>
    </div>
  );
}
