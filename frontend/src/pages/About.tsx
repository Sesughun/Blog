import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api/axios";
import { Eyebrow } from "../components/ui";
import { useFetch } from "../components/hooks";
import type { Writer } from "../types";

const FAQ = [
  ["How often do you publish?", "Two or three new stories a week, plus the Sunday letter."],
  ["Can I republish a Folio story?", "Please ask first. Send us a message with where you plan to publish it."],
  ["Do you accept guest writers?", "Yes. Send a pitch using the button above and an editor will reply."],
  ["How do you make money?", "Reader subscriptions and a small number of clearly labelled partnerships."],
];

function ContactForm({ defaultTopic }: { defaultTopic: string }) {
  const [form, setForm] = useState({ name: "", email: "", topic: defaultTopic, message: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/contact/", form);
      setMsg({ ok: true, text: "Thanks — we'll be in touch soon." });
      setForm({ name: "", email: "", topic: "general", message: "" });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  }

  return (
    <form className="contact-card" onSubmit={submit} id="contact">
      <h2>Say hello</h2>
      <label>Your name<input required value={form.name} onChange={set("name")} /></label>
      <label>Email<input required type="email" value={form.email} onChange={set("email")} /></label>
      <label>What's it about?
        <select value={form.topic} onChange={set("topic")}>
          <option value="general">General question</option>
          <option value="pitch">Writer pitch</option>
          <option value="feedback">Feedback</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label>Message<textarea required rows={5} value={form.message} onChange={set("message")} /></label>
      <button className="btn btn-primary block">Send message</button>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}

export default function About() {
  const writers = useFetch<Writer[]>("/writers/");
  const [open, setOpen] = useState(0);
  const [topic, setTopic] = useState("general");

  return (
    <>
      <section className="container narrow center about-hero">
        <Eyebrow>hello, and welcome</Eyebrow>
        <h1 className="display">A home for <em>slow, useful</em> writing.</h1>
        <p className="lede">Folio is an independent blog about culture, technology, money and everyday life. We publish fewer stories, take longer on each one, and try to leave you with something you can use.</p>
      </section>

      <section className="container story">
        <div className="story-img cover cover-amber"><span className="sticker">where it all started</span></div>
        <div>
          <h2>Our story</h2>
          <p>Folio began as a reaction to noisy feeds: a place where one good story gets the time it deserves.</p>
          <p>We choose what we publish carefully, edit every piece, and write for people who want to understand rather than react.</p>
          <p>Next, we want to grow a small, trusted team of writers across more topics.</p>
        </div>
      </section>

      <section className="dark-band">
        <div className="container">
          <Eyebrow>what we believe</Eyebrow>
          <h2>Three promises to readers</h2>
          <div className="grid-3">
            {[["Useful over loud", "Every story should leave you knowing something, or seeing something, a little differently."],
              ["Honest and checked", "We cite our sources, correct our mistakes in public, and never publish paid posts as editorial."],
              ["Worth your time", "Fewer stories, made carefully. If it is not worth reading to the end, we do not publish it."]].map(([t, d], i) => (
              <div key={t} className="promise"><span className="num">0{i + 1}</span><strong>{t}</strong><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <Eyebrow>the people behind it</Eyebrow>
        <div className="section-head"><h2>Meet the team</h2><Link to="/writers">All writers →</Link></div>
        <div className="grid-4">
          {writers.data?.map((w) => (
            <Link key={w.id} to={`/writers/${w.id}`} className="polaroid-card">
              <div className="polaroid"><div className="polaroid-img" style={{ background: w.color }}>{w.initial}</div><span className="script">{w.tagline}</span></div>
              <strong>{w.name}</strong><small>{w.job_title}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="pitch-band">
          <div>
            <Eyebrow>got a story?</Eyebrow>
            <h2>Write for <em>Folio.</em></h2>
            <p className="muted">We are always looking for thoughtful, useful pieces from new voices. Send us a short pitch: the idea, why it matters, and why you're the person to write it.</p>
          </div>
          <a className="btn btn-dark" href="#contact" onClick={() => setTopic("pitch")}>Send a pitch →</a>
        </div>
      </section>

      <section className="container faq-contact section">
        <div>
          <Eyebrow>good questions</Eyebrow>
          <h2>FAQ</h2>
          {FAQ.map(([q, a], i) => (
            <div key={q} className="faq-item">
              <button onClick={() => setOpen(open === i ? -1 : i)}><strong>{q}</strong><span>{open === i ? "−" : "+"}</span></button>
              {open === i && <p className="muted">{a}</p>}
            </div>
          ))}
        </div>
        <ContactForm key={topic} defaultTopic={topic} />
      </section>
    </>
  );
}
