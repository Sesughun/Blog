import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import type { AdminUser, Category, Comment, ContactMessage, Page, PostSummary, Role, Stats } from "../types";
import { Eyebrow, State } from "../components/ui";
import { formatDate, useFetch } from "../components/hooks";

type Tab = "overview" | "users" | "stories" | "topics" | "comments" | "messages";
const TABS: Tab[] = ["overview", "users", "stories", "topics", "comments", "messages"];

function Overview() {
  const { data, loading, error } = useFetch<Stats>("/admin/stats/");
  const cards: [string, number | undefined][] = [
    ["Users", data?.users], ["Writers", data?.writers], ["Readers", data?.readers],
    ["Published", data?.published], ["Awaiting review", data?.pending], ["Drafts", data?.drafts],
    ["Responses", data?.comments], ["Subscribers", data?.subscribers], ["Open messages", data?.unresolved_messages],
  ];
  return (
    <State loading={loading} error={error}>
      <div className="grid-3">
        {cards.map(([label, n]) => <div key={label} className="stat"><strong>{n}</strong><small>{label}</small></div>)}
      </div>
    </State>
  );
}

function Users() {
  const { user: me } = useAuth();
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const { data, loading, error: loadError } = useFetch<Page<AdminUser>>("/users/?page_size=100", [version]);

  async function patch(id: number, body: Partial<AdminUser>) {
    try {
      await api.patch(`/users/${id}/`, body);
      setError("");
      setVersion(version + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this account and all of its stories and responses?")) return;
    try {
      await api.delete(`/users/${id}/`);
      setVersion(version + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <State loading={loading} error={loadError}>
      {error && <p className="err">{error}</p>}
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Stories</th><th>Joined</th><th>Active</th><th /></tr></thead>
        <tbody>
          {data?.results.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} disabled={u.id === me?.id} onChange={(e) => patch(u.id, { role: e.target.value as Role })}>
                  <option value="reader">Reader</option><option value="writer">Writer</option><option value="admin">Admin</option>
                </select>
              </td>
              <td>{u.post_count}</td>
              <td>{formatDate(u.date_joined)}</td>
              <td><input type="checkbox" checked={u.is_active} disabled={u.id === me?.id} onChange={(e) => patch(u.id, { is_active: e.target.checked })} /></td>
              <td className="actions">{u.id !== me?.id && <button className="link-btn" onClick={() => remove(u.id)}>Delete</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </State>
  );
}

function Stories() {
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState("pending");
  const { data, loading, error } = useFetch<Page<PostSummary>>(`/posts/manage/?page_size=100${status ? `&status=${status}` : ""}`, [version, status]);

  async function patch(slug: string, body: Record<string, unknown>) {
    await api.patch(`/posts/${slug}/`, body);
    setVersion(version + 1);
  }
  async function remove(slug: string) {
    if (!confirm("Delete this story permanently?")) return;
    await api.delete(`/posts/${slug}/`);
    setVersion(version + 1);
  }

  return (
    <>
      <div className="chips">
        {["pending", "published", "draft", ""].map((s) => (
          <button key={s} className={status === s ? "chip active" : "chip"} onClick={() => setStatus(s)}>{s || "All"}</button>
        ))}
      </div>
      <State loading={loading} error={error}>
        <table className="table">
          <thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Featured</th><th>Pick</th><th /></tr></thead>
          <tbody>
            {data?.results.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/post/${p.slug}`}>{p.title}</Link></td>
                <td>{p.author.name}</td>
                <td><span className={`status status-${p.status}`}>{p.status}</span></td>
                <td><input type="checkbox" checked={p.is_featured} onChange={(e) => patch(p.slug, { is_featured: e.target.checked })} /></td>
                <td><input type="checkbox" checked={p.is_editors_pick} onChange={(e) => patch(p.slug, { is_editors_pick: e.target.checked })} /></td>
                <td className="actions">
                  {p.status !== "published" && <button className="link-btn" onClick={() => patch(p.slug, { status: "published" })}>Publish</button>}
                  {p.status === "published" && <button className="link-btn" onClick={() => patch(p.slug, { status: "draft" })}>Unpublish</button>}
                  <Link to={`/dashboard/edit/${p.slug}`}>Edit</Link>
                  <button className="link-btn" onClick={() => remove(p.slug)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.results.length && <p className="state">Nothing here.</p>}
      </State>
    </>
  );
}

function Topics() {
  const [version, setVersion] = useState(0);
  const [form, setForm] = useState({ name: "", description: "", color: "#b9452a" });
  const [error, setError] = useState("");
  const { data, loading, error: loadError } = useFetch<Category[]>("/categories/", [version]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/categories/", form);
      setForm({ name: "", description: "", color: "#b9452a" });
      setError("");
      setVersion(version + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  async function remove(slug: string) {
    if (!confirm("Delete this topic?")) return;
    try {
      await api.delete(`/categories/${slug}/`);
      setVersion(version + 1);
    } catch {
      setError("A topic that still has stories can't be deleted. Move or delete its stories first.");
    }
  }

  return (
    <State loading={loading} error={loadError}>
      <form className="inline-form" onSubmit={add}>
        <input required placeholder="Topic name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        <button className="btn btn-primary btn-sm">Add topic</button>
      </form>
      {error && <p className="err">{error}</p>}
      <table className="table">
        <thead><tr><th>Topic</th><th>Stories</th><th /></tr></thead>
        <tbody>
          {data?.map((c) => (
            <tr key={c.id}>
              <td><i className="dot" style={{ background: c.color }} />{c.name}</td>
              <td>{c.post_count}</td>
              <td className="actions"><button className="link-btn" onClick={() => remove(c.slug)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </State>
  );
}

function Comments() {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useFetch<Page<Comment>>("/comments/?page_size=100", [version]);
  async function remove(id: number) {
    await api.delete(`/comments/${id}/`);
    setVersion(version + 1);
  }
  return (
    <State loading={loading} error={error}>
      <table className="table">
        <thead><tr><th>Response</th><th>By</th><th>On</th><th>Date</th><th /></tr></thead>
        <tbody>
          {data?.results.map((c) => (
            <tr key={c.id}>
              <td>{c.body}</td><td>{c.user.name}</td>
              <td><Link to={`/post/${c.post_slug}`}>{c.post_title}</Link></td>
              <td>{formatDate(c.created_at)}</td>
              <td className="actions"><button className="link-btn" onClick={() => remove(c.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data?.results.length && <p className="state">No responses.</p>}
    </State>
  );
}

function Messages() {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useFetch<Page<ContactMessage>>("/contact/?page_size=100", [version]);
  async function patch(id: number, is_resolved: boolean) {
    await api.patch(`/contact/${id}/`, { is_resolved });
    setVersion(version + 1);
  }
  async function remove(id: number) {
    await api.delete(`/contact/${id}/`);
    setVersion(version + 1);
  }
  return (
    <State loading={loading} error={error}>
      <div className="messages">
        {data?.results.map((m) => (
          <article key={m.id} className={m.is_resolved ? "message done" : "message"}>
            <div><strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a> · <span className="pill">{m.topic}</span> <small>{formatDate(m.created_at)}</small></div>
            <p>{m.message}</p>
            <div className="actions">
              <button className="link-btn" onClick={() => patch(m.id, !m.is_resolved)}>{m.is_resolved ? "Reopen" : "Mark resolved"}</button>
              <button className="link-btn" onClick={() => remove(m.id)}>Delete</button>
            </div>
          </article>
        ))}
        {!data?.results.length && <p className="state">No messages.</p>}
      </div>
    </State>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  const views: Record<Tab, ReactNode> = {
    overview: <Overview />, users: <Users />, stories: <Stories />,
    topics: <Topics />, comments: <Comments />, messages: <Messages />,
  };
  return (
    <section className="container section">
      <Eyebrow>admin</Eyebrow>
      <h1 className="page-title">Control room</h1>
      <div className="chips tabs">
        {TABS.map((t) => <button key={t} className={tab === t ? "chip active" : "chip"} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {views[tab]}
    </section>
  );
}
