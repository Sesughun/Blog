import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import type { Category, Page, PostDetail, PostSummary } from "../types";
import { Eyebrow, State } from "../components/ui";
import { formatDate, useFetch } from "../components/hooks";

const COVERS = ["rust", "blue", "green", "purple", "amber", "teal"];

export function Dashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useFetch<Page<PostSummary>>(`/posts/manage/?page=${page}`, [version]);

  async function remove(slug: string) {
    if (!confirm("Delete this story permanently?")) return;
    await api.delete(`/posts/${slug}/`);
    setVersion(version + 1);
  }

  return (
    <section className="container section">
      <div className="section-head">
        <div><Eyebrow>{user?.role === "admin" ? "all stories" : "your desk"}</Eyebrow><h1 className="page-title">{user?.role === "admin" ? "All stories" : "My stories"}</h1></div>
        <div className="chips">
          <Link className="btn btn-outline btn-sm" to="/dashboard/profile">Edit profile</Link>
          <Link className="btn btn-primary btn-sm" to="/dashboard/new">+ New story</Link>
        </div>
      </div>
      <State loading={loading} error={error}>
        <table className="table">
          <thead><tr><th>Title</th><th>Status</th><th>Author</th><th>Views</th><th>Updated</th><th /></tr></thead>
          <tbody>
            {data?.results.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/post/${p.slug}`}>{p.title}</Link></td>
                <td><span className={`status status-${p.status}`}>{p.status === "pending" ? "pending review" : p.status}</span></td>
                <td>{p.author.name}</td>
                <td>{p.views}</td>
                <td>{formatDate(p.updated_at)}</td>
                <td className="actions">
                  <Link to={`/dashboard/edit/${p.slug}`}>Edit</Link>
                  <button className="link-btn" onClick={() => remove(p.slug)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.results.length && <p className="state">No stories yet. Start your first one.</p>}
        <div className="pagination">
          <button className="chip" disabled={!data?.previous} onClick={() => setPage(page - 1)}>← Newer</button>
          <button className="chip" disabled={!data?.next} onClick={() => setPage(page + 1)}>Older →</button>
        </div>
      </State>
    </section>
  );
}

const blank = {
  title: "", excerpt: "", content: "", key_takeaways: "", tags: "", cover_color: "rust",
  cover_image: "", cover_caption: "", category: "", status: "draft", is_featured: false, is_editors_pick: false,
};

export function Editor() {
  const { slug } = useParams();
  const cats = useFetch<Category[]>("/categories/");
  const existing = useFetch<PostDetail>(slug ? `/posts/${slug}/` : null, [slug]);
  const ready = !!cats.data && (!slug || !!existing.data);

  return (
    <section className="container narrow section">
      <Eyebrow>{slug ? "edit story" : "new story"}</Eyebrow>
      <h1 className="page-title">{slug ? "Edit story" : "Write a story"}</h1>
      <State loading={!ready && !(cats.error || existing.error)} error={cats.error || existing.error}>
        {ready && (
          <EditorForm
            key={slug ?? "new"}
            slug={slug}
            categories={cats.data!}
            initial={existing.data ? { ...blank, ...existing.data, category: existing.data.category.slug } : { ...blank, category: cats.data![0]?.slug ?? "" }}
          />
        )}
      </State>
    </section>
  );
}

function EditorForm({ slug, categories, initial }: { slug?: string; categories: Category[]; initial: typeof blank }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "admin";

  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title, excerpt: form.excerpt, content: form.content, key_takeaways: form.key_takeaways,
        tags: form.tags, cover_color: form.cover_color, cover_image: form.cover_image,
        cover_caption: form.cover_caption, category: form.category, status: form.status,
        ...(isAdmin && { is_featured: form.is_featured, is_editors_pick: form.is_editors_pick }),
      };
      if (slug) await api.patch(`/posts/${slug}/`, body);
      else await api.post("/posts/", body);
      navigate("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <label>Title<input required value={form.title} onChange={set("title")} /></label>
      <label>Summary (shown on cards)<textarea rows={2} value={form.excerpt} onChange={set("excerpt")} /></label>
      <div className="two-fields">
        <label>Topic
          <select required value={form.category} onChange={set("category")}>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label>Cover colour
          <select value={form.cover_color} onChange={set("cover_color")}>{COVERS.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
      </div>
      <div className="two-fields">
        <label>Cover image URL (optional)<input type="url" value={form.cover_image} onChange={set("cover_image")} /></label>
        <label>Cover caption<input value={form.cover_caption} onChange={set("cover_caption")} /></label>
      </div>
      <label>Story
        <textarea required rows={16} value={form.content} onChange={set("content")} />
        <small className="muted">Separate paragraphs with a blank line. Use “## ” for headings, “&gt; ” for pull quotes and “- ” for bullet lists.</small>
      </label>
      <label>Key takeaways (one per line)<textarea rows={3} value={form.key_takeaways} onChange={set("key_takeaways")} /></label>
      <label>Tags (comma separated)<input value={form.tags} onChange={set("tags")} /></label>
      <label>Status
        <select value={form.status} onChange={set("status")}>
          <option value="draft">Draft</option>
          <option value="pending">Submit for review</option>
          {(isAdmin || form.status === "published") && <option value="published">Published</option>}
        </select>
      </label>
      {isAdmin && (
        <div className="checks">
          <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured on home page</label>
          <label><input type="checkbox" checked={form.is_editors_pick} onChange={(e) => setForm({ ...form, is_editors_pick: e.target.checked })} /> Editor's pick</label>
        </div>
      )}
      {error && <p className="err">{error}</p>}
      <div className="chips"><button className="btn btn-primary" disabled={saving}>Save story</button><Link className="btn btn-outline" to="/dashboard">Cancel</Link></div>
    </form>
  );
}

export function ProfileEditor() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "", last_name: user?.last_name ?? "", job_title: user?.job_title ?? "",
    tagline: user?.tagline ?? "", bio: user?.bio ?? "", website: user?.website ?? "",
    x_url: user?.x_url ?? "", linkedin_url: user?.linkedin_url ?? "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.patch("/auth/me/", form);
      await refresh();
      setMsg({ ok: true, text: "Profile saved." });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  }

  return (
    <section className="container narrow section">
      <Eyebrow>your public profile</Eyebrow>
      <h1 className="page-title">Edit profile</h1>
      <form className="editor" onSubmit={submit}>
        <div className="two-fields">
          <label>First name<input value={form.first_name} onChange={set("first_name")} /></label>
          <label>Last name<input value={form.last_name} onChange={set("last_name")} /></label>
        </div>
        <div className="two-fields">
          <label>Job title<input value={form.job_title} onChange={set("job_title")} /></label>
          <label>Tagline (shown under your photo)<input value={form.tagline} onChange={set("tagline")} /></label>
        </div>
        <label>Bio<textarea rows={4} value={form.bio} onChange={set("bio")} /></label>
        <label>Website<input type="url" value={form.website} onChange={set("website")} /></label>
        <label>X<input type="url" value={form.x_url} onChange={set("x_url")} /></label>
        <label>LinkedIn<input type="url" value={form.linkedin_url} onChange={set("linkedin_url")} /></label>
        {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
        <div className="chips"><button className="btn btn-primary">Save</button><Link className="btn btn-outline" to="/dashboard">Back</Link></div>
      </form>
    </section>
  );
}
