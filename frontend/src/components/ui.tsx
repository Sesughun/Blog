import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api/axios";
import type { PostSummary, Writer } from "../types";
import { formatDate } from "./hooks";

export function Cover({ post, className = "" }: { post: Pick<PostSummary, "cover_color" | "cover_image">; className?: string }) {
  return post.cover_image ? (
    <img className={`cover ${className}`} src={post.cover_image} alt="" />
  ) : (
    <div className={`cover cover-${post.cover_color} ${className}`} />
  );
}

export function Avatar({ writer, size = 28 }: { writer: Pick<Writer, "initial" | "color">; size?: number }) {
  return (
    <span className="avatar" style={{ background: writer.color, width: size, height: size, fontSize: size * 0.45 }}>
      {writer.initial}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PostCard({ post, variant = "card" }: { post: PostSummary; variant?: "card" | "row" | "mini" }) {
  const to = `/post/${post.slug}`;
  if (variant === "mini") {
    return (
      <Link to={to} className="mini-post">
        <Cover post={post} />
        <div>
          <strong>{post.title}</strong>
          <small>{post.reading_minutes} min read</small>
        </div>
      </Link>
    );
  }
  if (variant === "row") {
    return (
      <article className="row-post">
        <Link to={to}>
          <Cover post={post} />
        </Link>
        <div>
          <Link to={`/topics/${post.category.slug}`} className="kicker">{post.category.name}</Link>
          <h3><Link to={to}>{post.title}</Link></h3>
          <p>{post.excerpt}</p>
          <div className="byline">
            <Avatar writer={post.author} size={22} />
            <Link to={`/writers/${post.author.id}`}>{post.author.name}</Link>
            <span>· {formatDate(post.published_at)}</span>
            <span>· {post.reading_minutes} min read</span>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className="card-post">
      <Link to={to}>
        <Cover post={post} />
      </Link>
      <Link to={`/topics/${post.category.slug}`} className="kicker">
        <i style={{ background: post.category.color }} />
        {post.category.name}
      </Link>
      <h3><Link to={to}>{post.title}</Link></h3>
      <small>{formatDate(post.published_at)} · {post.reading_minutes} min read</small>
    </article>
  );
}

export function Newsletter({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/newsletter/", { email });
      setMsg({ ok: true, text: data.detail });
      setEmail("");
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  }

  return (
    <form className={`newsletter-form ${dark ? "dark" : ""}`} onSubmit={submit}>
      <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn btn-primary">Subscribe</button>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}

/** Renders the simple post markup: "## heading", "> quote", "- bullet" and plain paragraphs. */
export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
        if (b.startsWith("> ")) return <blockquote key={i}>{b.slice(2)}</blockquote>;
        if (b.split("\n").every((l) => l.startsWith("- ")))
          return <ul key={i}>{b.split("\n").map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
        return <p key={i} className={i === 0 ? "dropcap" : ""}>{b}</p>;
      })}
    </div>
  );
}

export function State({ loading, error, children }: { loading: boolean; error: boolean; children: ReactNode }) {
  if (loading) return <p className="state">Loading…</p>;
  if (error) return <p className="state">Something went wrong loading this page.</p>;
  return <>{children}</>;
}
