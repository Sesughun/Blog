import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import type { Category, Page, PostSummary } from "../types";
import { Eyebrow, Newsletter, PostCard, State } from "../components/ui";
import { useFetch } from "../components/hooks";

export function TopicsIndex() {
  const { data, loading, error } = useFetch<Category[]>("/categories/");
  return (
    <section className="container section">
      <Eyebrow>find your corner</Eyebrow>
      <h1 className="page-title">Topics</h1>
      <State loading={loading} error={error}>
        <div className="grid-4 topics-grid">
          {data?.map((c) => (
            <Link key={c.id} to={`/topics/${c.slug}`} className="topic-card">
              <span className="badge" style={{ background: c.color }}>{c.initial}</span>
              <strong>{c.name}</strong>
              <p>{c.description}</p>
              <span className="explore">{c.post_count} stories →</span>
            </Link>
          ))}
        </div>
      </State>
    </section>
  );
}

/** Category page; slug "all" shows the whole archive and supports ?q= search. */
export function Topic() {
  const { slug = "all" } = useParams();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const { user, refresh } = useAuth();
  const isAll = slug === "all";

  const category = useFetch<Category>(isAll ? null : `/categories/${slug}/`, [slug]);
  const popular = useFetch<PostSummary[]>("/posts/trending/");
  const others = useFetch<Category[]>("/categories/");
  const qs = new URLSearchParams({ page: String(page), sort });
  if (!isAll) qs.set("category", slug);
  if (q) qs.set("search", q);
  const posts = useFetch<Page<PostSummary>>(`/posts/?${qs}`, [slug, q]);

  const following = !!user?.followed_categories.includes(slug);
  async function follow() {
    await api.post(`/categories/${slug}/follow/`);
    await refresh();
  }

  const name = isAll ? (q ? `Results for “${q}”` : "The archive") : category.data?.name ?? "";
  const pages = Math.max(1, Math.ceil((posts.data?.count ?? 0) / 6));

  return (
    <>
      <section className="tint-band page-head">
        <div className="container head-split">
          <div>
            <nav className="crumbs"><Link to="/">Home</Link> / <Link to="/topics">Topics</Link> / {name}</nav>
            <h1 className="page-title">{name}</h1>
            <p className="muted">{isAll ? "Every story we have published, newest first." : category.data?.description}</p>
          </div>
          {!isAll && (
            <div className="follow-box">
              <span className="script">never miss a {name.toLowerCase()} story</span>
              {user
                ? <button className="btn btn-outline" onClick={follow}>{following ? "✓ Following" : `+ Follow ${name}`}</button>
                : <Link className="btn btn-outline" to="/login">+ Follow {name}</Link>}
            </div>
          )}
        </div>
      </section>

      <div className="container filter-bar">
        <span />
        <label>Sort by
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="newest">Newest</option>
            <option value="popular">Most read</option>
          </select>
        </label>
      </div>

      <div className="container topic-layout">
        <div>
          <State loading={posts.loading} error={posts.error}>
            {posts.data?.results.map((p) => <PostCard key={p.id} post={p} variant="row" />)}
            {!posts.data?.results.length && <p className="state">No stories found.</p>}
            <div className="pagination">
              <button className="chip" disabled={page === 1} onClick={() => setPage(page - 1)}>← Newer</button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={page === i + 1 ? "chip active round" : "chip round"} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="chip" disabled={page === pages} onClick={() => setPage(page + 1)}>Older →</button>
            </div>
          </State>
        </div>
        <aside>
          <Eyebrow>most read{isAll ? "" : ` in ${name.toLowerCase()}`}</Eyebrow>
          <h2 className="aside-title">Popular</h2>
          <ol className="ranked">
            {popular.data?.map((p, i) => (
              <li key={p.id}><span className="num">{i + 1}</span><Link to={`/post/${p.slug}`}>{p.title}</Link></li>
            ))}
          </ol>
          <div className="dark-card box">
            <small className="script">the sunday letter</small>
            <strong>The week's best stories, every Sunday.</strong>
            <Newsletter dark />
          </div>
          <h3>Other topics</h3>
          <div className="chips">
            {others.data?.filter((c) => c.slug !== slug).map((c) => <Link key={c.id} className="chip" to={`/topics/${c.slug}`}>{c.name}</Link>)}
          </div>
        </aside>
      </div>
    </>
  );
}
