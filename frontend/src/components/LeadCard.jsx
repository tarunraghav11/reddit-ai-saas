import { useState } from "react";

export default function LeadCard({ post }) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    const prompt = `I need to reply to this Reddit post:
Title: ${post.title}
Community: r/${post.subreddit}
User Pain Point: ${post.pain || "Implicit need"}

Goal: Write a helpful, empathetic response that provides value first, then subtly mentions a tool that solves their problem. Avoid sounding like a bot or being spammy.
Context: ${post.reason || "AI identified this as a potential lead."}

Draft 3 variations of a reply.`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const intent = post.intent || "LOW";
  const pct = post.opportunity ?? Math.round((post.finalScore ?? 0) * 100);

  return (
    <div className="lead-card">
      {/* Header: badge + title */}
      <div className="lead-card-header">
        <span className={`intent-badge ${intent}`}>{intent}</span>
        <div>
          <h3 className="lead-title">{post.title}</h3>
          <p className="lead-sub">r/{post.subreddit}</p>
        </div>
        {/* Opportunity ring */}
        <div
          className="opportunity-ring"
          style={{ "--pct": `${pct}%` }}
          data-pct={pct}
          title={`${pct}% opportunity score`}
        />
      </div>

      {/* Stats row */}
      <div className="lead-stats">
        <span className="lead-stat">🔥 <strong>{post.upvotes ?? 0}</strong> upvotes</span>
        <span className="lead-stat">💬 <strong>{post.comments ?? 0}</strong> comments</span>
        {post.finalScore != null && (
          <span className="lead-stat">⭐ Score: <strong>{post.finalScore}</strong></span>
        )}
      </div>

      {/* Pain point */}
      {post.pain && (
        <div className="lead-pain">
          <strong>Pain:</strong> {post.pain}
        </div>
      )}

      {/* AI reason */}
      {post.reason && (
        <p className="lead-reason">{post.reason}</p>
      )}

      {/* Actions */}
      <div className="lead-actions">
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer"
          className="btn-outline"
        >
          View Post →
        </a>
        <button
          className={`btn-solid ${copied ? "copied" : ""}`}
          onClick={handleCopyPrompt}
        >
          {copied ? "✓ Copied!" : "📋 Copy Reply Prompt"}
        </button>
      </div>
    </div>
  );
}
