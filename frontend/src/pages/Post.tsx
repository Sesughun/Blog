import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import type { Comment, Page, PostDetail, PostSummary } from "../types";
import { Avatar, Cover, Eyebrow, PostCard, Prose, State } from "../components/ui";
import { formatDate, useFetch } from "../components/hooks";

function useReadProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return pct;
}

function Responses({ slug }: { slug: string }) {
  const { user } = useAuth();
  const { data, setData } = useFetch<Comment[]>(`/posts/${slug}/comments/`, [slug]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const { data: created } = await api.post<Comment>(`/posts/${slug}/comments/`, { body });
      setData([created, ...(data ?? [])]);
      setBody("");
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(id: number) {
    await api.delete(`/comments/${id}/`);
    setData((data ?? []).filter((c) => c.id !== id));
  }

  return (
    <section className="responses">
      <h2>Responses <span className="muted">({data?.length ?? 0})</span></h2>
      {user ? (
        <form className="response-form" onSubmit={submit}>
          <label>Add your thoughts</label>
          <textarea required placeholder="What did this make you think of?" value={body} onChange={(e) => setBody(e.target.value)} />
          {error && <p className="err">{error}</p>}
          <button className="btn btn-primary btn-sm">Post response</button>
        </form>
      ) : (
        <p className="callout"><Link to="/login" state={{ from: `/post/${slug}` }}><strong>Log in</strong></Link> or <Link to="/register"><strong>create an account</strong></Link> to join the conversation.</p>
      )}
      {data?.map((c) => (
        <div key={c.id} className="response">
          <Avatar writer={c.user} size={32} />
          <div>
            <small><strong>{c.user.name}</strong> · {formatDate(c.created_at)}</small>
            <p>{c.body}</p>
            {user && (user.role === "admin" || user.id === c.user.id) && <button className="link-btn" onClick={() => remove(c.id)}>Delete</button>}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Post() {
  const { slug = "" } = useParams();
  const { user, refresh } = useAuth();
  const { data: post, loading, error, setData } = useFetch<PostDetail>(`/posts/${slug}/`, [slug]);
  const more = useFetch<Page<PostSummary>>(post ? `/posts/?category=${post.category.slug}` : null, [post?.category.slug]);
  const progress = useReadProgress();
  const [fontScale, setFontScale] = useState(1);
  const [copied, setCopied] = useState(false);

  async function toggleSave() {
    const { data } = await api.post<{ saved: boolean }>(`/posts/${slug}/save/`);
    setData(post && { ...post, is_saved: data.saved });
    refresh();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const words = post?.title.split(" ") ?? [];
  const headings = post?.content.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3)) ?? [];
  const canEdit = !!user && !!post && (user.role === "admin" || user.id === post.author.id);

  return (
    <State loading={loading} error={error}>
      {post && (
        <>
          <div className="progress" style={{ width: `${progress}%` }} />
          <article>
            <header className="container narrow post-head">
              <nav className="crumbs"><Link to="/">Home</Link> / <Link to={`/topics/${post.category.slug}`}>{post.category.name}</Link></nav>
              {post.status !== "published" && <p className="notice">This story is {post.status === "draft" ? "a draft" : "awaiting review"} — only you and admins can see it.</p>}
              <h1 className="post-title">{words.slice(0, -2).join(" ")} <em>{words.slice(-2).join(" ")}</em></h1>
              <p className="lede">{post.excerpt}</p>
              <div className="byline center">
                <Avatar writer={post.author} size={36} />
                <div><Link to={`/writers/${post.author.id}`}><strong>{post.author.name}</strong></Link><small>{post.author.job_title}</small></div>
                <span>{formatDate(post.published_at)} · {post.reading_minutes} min read</span>
                {canEdit && <Link className="chip" to={`/dashboard/edit/${post.slug}`}>Edit</Link>}
              </div>
            </header>
            <div className="container">
              <Cover post={post} className="cover-hero" />
              {post.cover_caption && <p className="caption">{post.cover_caption}</p>}
            </div>

            <div className="container post-layout">
              <aside className="post-side">
                {!!headings.length && (
                  <>
                    <Eyebrow>in this story</Eyebrow>
                    <ul className="toc">{headings.map((h) => <li key={h}>{h}</li>)}</ul>
                  </>
                )}
                <p className="side-label">Reading options</p>
                <div className="split-btns">
                  <button className="btn btn-outline btn-sm" onClick={() => setFontScale(Math.max(0.85, fontScale - 0.1))}>A-</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setFontScale(Math.min(1.4, fontScale + 0.1))}>A+</button>
                </div>
                {user
                  ? <button className="btn btn-outline btn-sm block" onClick={toggleSave}>{post.is_saved ? "★ Saved" : "☆ Save for later"}</button>
                  : <Link className="btn btn-outline btn-sm block" to="/login" state={{ from: `/post/${slug}` }}>☆ Save for later</Link>}
                <button className="btn btn-dark btn-sm block" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button>
              </aside>

              <div className="post-body" style={{ fontSize: `${fontScale}em` }}>
                <Prose text={post.content} />
                {!!post.takeaways.length && (
                  <div className="takeaways">
                    <span className="script">key takeaways</span>
                    <ul>{post.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                )}
                <div className="chips tags">{post.tag_list.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                <div className="author-box">
                  <Avatar writer={post.author} size={52} />
                  <div>
                    <span className="script">written by</span>
                    <strong>{post.author.name}</strong>
                    <p className="muted">{post.author.bio}</p>
                  </div>
                  <Link className="btn btn-outline btn-sm" to={`/writers/${post.author.id}`}>All stories by {post.author.name.split(" ")[0]}</Link>
                </div>
                <Responses slug={post.slug} />
              </div>
            </div>
          </article>

          <section className="dark-band">
            <div className="container">
              <Eyebrow>before you go</Eyebrow>
              <div className="section-head"><h2>Keep reading</h2><Link to={`/topics/${post.category.slug}`}>More in {post.category.name} →</Link></div>
              <div className="grid-3 on-dark">
                {more.data?.results.filter((p) => p.id !== post.id).slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            </div>
          </section>
        </>
      )}
    </State>
  );
}
