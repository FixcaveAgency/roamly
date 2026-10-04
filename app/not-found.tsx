import Link from "next/link";
export default function NotFound() {
  return (
    <main className="public-loading">
      <p className="eyebrow">OFF THE BEATEN PATH</p>
      <h1>This place is not on the map.</h1>
      <p>The page may have moved. Your next adventure is still waiting.</p>
      <Link className="btn primary" href="/">
        Back to my world
      </Link>
    </main>
  );
}
