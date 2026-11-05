import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import type { Page, PostSummary, Writer } from "../types";
import { Avatar, Eyebrow, PostCard, State } from "../components/ui";
import { useFetch } from "../components/hooks";

export function WritersIndex() {
  const { data, loading, error } = useFetch<Writer[]>("/writers/");
  return (
    <section className="container section">
      <Eyebrow>the people behind it</Eyebrow>
      <h1 className="page-title">Writers</h1>
      <State loading={loading} error={error}>
        <div className="writer-grid">
          {data?.map((w) => (
            <Link key={w.id} to={`/writers/${w.id}`} className="writer-chip big">
              <Avatar writer={w} size={52} />
              <div><strong>{w.name}</strong><small>{w.job_title}</small></div>
            </Link>
          ))}
        </div>
      </State>
    </section>
  );
}

export function WriterProfile() {
  const { id } = useParams();
  const { user, refresh } = useAuth();
  const writer = useFetch<Writer>(`/writers/${id}/`, [id]);
  const posts = useFetch<Page<PostSummary>>(`/posts/?writer=${id}`, [id]);
  const others = useFetch<Writer[]>("/writers/");
  const w = writer.data;
  const following = !!user?.followed_writers.includes(Number(id));

  async function follow() {
    await api.post(`/writers/${id}/follow/`);
    await refresh();
  }

  return (
    <State loading={writer.loading} error={writer.error}>
      {w && (
        <>
          <section className="container writer-hero">
            <div className="polaroid" style={{ ["--c" as string]: w.color }}>
              <div className="polaroid-img" style={{ background: w.color }}>{w.initial}</div>
              <span className="script">{w.tagline || "that's me!"}</span>
            </div>
            <div>
              <Eyebrow>{w.job_title}</Eyebrow>
              <h1 className="page-title">{w.name}</h1>
              <p className="lede">{w.bio}</p>
              <div className="chips">
                {user
                  ? <button className="btn btn-outline" onClick={follow}>{following ? "✓ Following" : `+ Follow ${w.name.split(" ")[0]}`}</button>
                  : <Link className="btn btn-outline" to="/login">+ Follow {w.name.split(" ")[0]}</Link>}
                {w.website && <a className="chip" href={w.website} target="_blank" rel="noreferrer">Website</a>}
                {w.x_url && <a className="chip" href={w.x_url} target="_blank" rel="noreferrer">X</a>}
                {w.linkedin_url && <a className="chip" href={w.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
              </div>
            </div>
          </section>
          <section className="container section">
            <hr className="rule dark" />
            <div className="section-head"><h2>Stories by {w.name.split(" ")[0]}</h2><small className="muted">Newest first</small></div>
            <State loading={posts.loading} error={posts.error}>
              <div className="grid-3">{posts.data?.results.map((p) => <PostCard key={p.id} post={p} />)}</div>
              {!posts.data?.results.length && <p className="state">No published stories yet.</p>}
            </State>
          </section>
          <section className="tint-band">
            <div className="container">
              <Eyebrow>also writing here</Eyebrow>
              <h2>Meet the other writers</h2>
              <div className="writer-grid">
                {others.data?.filter((o) => o.id !== w.id).map((o) => (
                  <Link key={o.id} to={`/writers/${o.id}`} className="writer-chip"><Avatar writer={o} size={40} /><div><strong>{o.name}</strong><small>{o.job_title}</small></div></Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </State>
  );
}
