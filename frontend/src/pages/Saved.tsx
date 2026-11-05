import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Category, Page, PostSummary, Writer } from "../types";
import { Eyebrow, PostCard, State } from "../components/ui";
import { useFetch } from "../components/hooks";

export default function Saved() {
  const { user } = useAuth();
  const saved = useFetch<Page<PostSummary>>("/posts/?saved=1", [user?.saved_posts.length]);
  const cats = useFetch<Category[]>("/categories/");
  const writers = useFetch<Writer[]>("/writers/");
  const followedCats = cats.data?.filter((c) => user?.followed_categories.includes(c.slug)) ?? [];
  const followedWriters = writers.data?.filter((w) => user?.followed_writers.includes(w.id)) ?? [];

  return (
    <section className="container section">
      <Eyebrow>your reading list</Eyebrow>
      <h1 className="page-title">Saved stories</h1>
      <State loading={saved.loading} error={saved.error}>
        <div className="grid-3">{saved.data?.results.map((p) => <PostCard key={p.id} post={p} />)}</div>
        {!saved.data?.results.length && <p className="state">Nothing saved yet. Use “Save for later” on any story.</p>}
      </State>
      <h2 className="section">Following</h2>
      <div className="chips">
        {followedCats.map((c) => <Link key={c.id} className="chip" to={`/topics/${c.slug}`}>{c.name}</Link>)}
        {followedWriters.map((w) => <Link key={w.id} className="chip" to={`/writers/${w.id}`}>{w.name}</Link>)}
        {!followedCats.length && !followedWriters.length && <span className="muted">You aren't following any topics or writers yet.</span>}
      </div>
    </section>
  );
}
