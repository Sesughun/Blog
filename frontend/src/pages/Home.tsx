import { useState } from "react";
import { Link } from "react-router-dom";
import type { Category, Page, PostSummary } from "../types";
import { Avatar, Cover, Eyebrow, Newsletter, PostCard, State } from "../components/ui";
import { formatDate, useFetch } from "../components/hooks";

function CategoryColumn({ category }: { category: Category }) {
  const { data } = useFetch<Page<PostSummary>>(`/posts/?category=${category.slug}`);
  const posts = data?.results ?? [];
  if (!posts.length) return null;
  const [lead, ...rest] = posts;
  return (
    <section className="cat-col">
      <div className="cat-col-head">
        <h2><i style={{ background: category.color }} />{category.name}</h2>
        <Link to={`/topics/${category.slug}`}>See all →</Link>
      </div>
      <Link to={`/post/${lead.slug}`}><Cover post={lead} className="cover-wide" /></Link>
      <h3 className="lead-title"><Link to={`/post/${lead.slug}`}>{lead.title}</Link></h3>
      <p className="muted">{lead.excerpt}</p>
      {rest.slice(0, 3).map((p) => <PostCard key={p.id} post={p} variant="mini" />)}
    </section>
  );
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const featured = useFetch<Page<PostSummary>>("/posts/?featured=1");
  const latest = useFetch<Page<PostSummary>>(`/posts/?${topic ? `category=${topic}` : ""}`, [topic]);
  const trending = useFetch<PostSummary[]>("/posts/trending/");
  const picks = useFetch<Page<PostSummary>>("/posts/?picks=1");
  const cats = useFetch<Category[]>("/categories/");

  const hero = featured.data?.results[0] ?? latest.data?.results[0];
  const categories = cats.data ?? [];
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="topbar">
        <div className="container bar">
          <span>{today}</span>
          <div>
            <Link to="/topics/all">Trending</Link>
            {categories.slice(0, 4).map((c) => <Link key={c.id} to={`/topics/${c.slug}`}>{c.name}</Link>)}
          </div>
        </div>
      </div>

      <section className="container hero-grid">
        <State loading={featured.loading} error={featured.error}>
          {hero ? (
            <article className="hero">
              <Link to={`/post/${hero.slug}`} className="hero-img">
                <Cover post={hero} className="cover-hero" />
                <span className="sticker">editor's pick</span>
              </Link>
              <div className="meta-line">
                <span className="pill">{hero.category.name}</span>
                <span>{hero.reading_minutes} min read · {formatDate(hero.published_at)}</span>
              </div>
              <h1><Link to={`/post/${hero.slug}`}>{hero.title}</Link></h1>
              <p className="lede">{hero.excerpt}</p>
              <div className="byline"><Avatar writer={hero.author} /><Link to={`/writers/${hero.author.id}`}>{hero.author.name}</Link></div>
            </article>
          ) : <p className="state">No stories published yet.</p>}
        </State>
        <aside>
          <Eyebrow>what everyone's reading</Eyebrow>
          <h2 className="aside-title">Trending</h2>
          <ol className="ranked">
            {(trending.data ?? []).map((p, i) => (
              <li key={p.id}>
                <span className="num">{i + 1}</span>
                <div><Link to={`/post/${p.slug}`}>{p.title}</Link><small>{p.category.name} · {p.reading_minutes} min</small></div>
              </li>
            ))}
          </ol>
          <div className="callout">
            <Eyebrow>new here?</Eyebrow>
            <Link to="/about"><strong>Start with the stories that explain what Folio is about →</strong></Link>
          </div>
        </aside>
      </section>

      <section className="container section">
        <hr className="rule" />
        <div className="section-head">
          <div><Eyebrow>fresh off the desk</Eyebrow><h2>Latest stories</h2></div>
          <div className="chips">
            <button className={!topic ? "chip active" : "chip"} onClick={() => setTopic("")}>All</button>
            {categories.map((c) => (
              <button key={c.id} className={topic === c.slug ? "chip active" : "chip"} onClick={() => setTopic(c.slug)}>{c.name}</button>
            ))}
          </div>
        </div>
        <State loading={latest.loading} error={latest.error}>
          <div className="grid-3">
            {(latest.data?.results ?? []).map((p) => <PostCard key={p.id} post={p} />)}
          </div>
          {!latest.data?.results.length && <p className="state">Nothing here yet.</p>}
        </State>
      </section>

      {!!picks.data?.results.length && (
        <section className="dark-band">
          <div className="container">
            <Eyebrow>worth your weekend</Eyebrow>
            <div className="section-head">
              <h2>Editor's <em>picks</em></h2>
              <p className="muted-light">Long reads we think deserve a second look. Make some tea, put the phone on silent.</p>
            </div>
            <div className="grid-4">
              {picks.data.results.slice(0, 4).map((p, i) => (
                <Link key={p.id} to={`/post/${p.slug}`} className="pick">
                  <Cover post={p} className="cover-tall" />
                  <span className="pick-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="pick-body">
                    <small>{p.category.name} · {p.reading_minutes} min</small>
                    <strong>{p.title}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container section two-col">
        {categories.filter((c) => c.post_count).slice(0, 2).map((c) => <CategoryColumn key={c.id} category={c} />)}
      </section>

      <section className="tint-band">
        <div className="container">
          <Eyebrow>find your corner</Eyebrow>
          <h2>Explore by topic</h2>
          <div className="grid-4 topics-grid">
            {categories.map((c) => (
              <Link key={c.id} to={`/topics/${c.slug}`} className="topic-card">
                <span className="badge" style={{ background: c.color }}>{c.initial}</span>
                <strong>{c.name}</strong>
                <p>{c.description}</p>
                <span className="explore">Explore →</span>
              </Link>
            ))}
            <Link to="/topics/all" className="topic-card dark-card">
              <small>everything, in order</small>
              <strong>Browse the full archive →</strong>
            </Link>
          </div>
        </div>
      </section>

      <section className="container section letter" id="newsletter">
        <div>
          <Eyebrow>the sunday letter</Eyebrow>
          <h2 className="big">The best of the week, <em>in one email.</em></h2>
          <p className="muted">Every Sunday morning: our favourite new stories, one thing worth reading elsewhere, and a short note from the editor.</p>
          <Newsletter />
          <small className="muted">Free. One email a week. Unsubscribe anytime.</small>
        </div>
        <div className="letter-card"><p>Dear reader,</p><p>This week we wrote about why people are building their own little corners of the internet again…</p><span className="script">until Sunday, the editor</span></div>
      </section>
    </>
  );
}
