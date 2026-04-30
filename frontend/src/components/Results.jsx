import LeadCard from "./LeadCard";

export default function Results({ posts }) {
  if (!posts.length) return <p>No results yet</p>;

  return (
    <div style={{ marginTop: "20px" }}>
      {posts.map(post => (
        <LeadCard key={post.id} post={post} />
      ))}
    </div>
  );
}