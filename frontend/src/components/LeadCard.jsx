import { useState, useCallback } from "react";
import { generateReply } from "../services/api";

export default function LeadCard({ post }) {
  const [copied, setCopied] = useState(false);
  const [replies, setReplies] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const handleCopyPrompt = () => {
    const prompt = `I need to reply to this Reddit post:\nTitle: ${post.title}\nCommunity: r/${post.subreddit}\nUser Pain Point: ${post.pain || "Implicit need"}\n\nGoal: Write a helpful, empathetic response that provides value first, then subtly mentions a tool that solves their problem. Avoid sounding like a bot or being spammy.\nContext: ${post.reason || "AI identified this as a potential lead."}\n\nDraft 2 variations of a reply.`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateReply = useCallback(async () => {
    if (replyLoading) return;
    setReplyLoading(true);
    setReplyError("");
    setReplies(null);

    const res = await generateReply({
      title: post.title,
      pain: post.pain || null,
      subreddit: post.subreddit || null,
      reason: post.reason || null,
    });

    setReplyLoading(false);
    if (!res.success) {
      setReplyError(res.message || "Failed to generate replies");
      return;
    }
    setReplies(res.replies || []);
  }, [post, replyLoading]);

  const handleCopyReply = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
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
          {copied ? "✓ Copied!" : "📋 Copy Prompt"}
        </button>
        <button
          className={`btn-generate ${replyLoading ? "loading" : ""}`}
          onClick={handleGenerateReply}
          disabled={replyLoading}
        >
          {replyLoading ? "⏳ Generating..." : "✨ Generate Reply"}
        </button>
      </div>

      {/* Reply error */}
      {replyError && (
        <p className="reply-error">{replyError}</p>
      )}

      {/* Generated replies */}
      {replies && replies.length > 0 && (
        <div className="reply-drafts">
          <h4 className="reply-drafts-title">AI Reply Drafts</h4>
          {replies.map((r, i) => (
            <div key={i} className="reply-draft">
              <div className="reply-draft-header">
                <span className="reply-tone">{r.tone || `Draft ${i + 1}`}</span>
                <button
                  className="reply-copy-btn"
                  onClick={() => handleCopyReply(r.text, i)}
                >
                  {copiedIdx === i ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
              <p className="reply-text">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
