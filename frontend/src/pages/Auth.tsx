import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { Eyebrow } from "../components/ui";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  if (user && !busy) return <Navigate to={from ?? "/"} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const me = mode === "login" ? await login(form.email, form.password) : await register(form);
      navigate(from ?? (me.role === "admin" ? "/admin" : me.role === "writer" ? "/dashboard" : "/"), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <section className="container narrow section">
      <form className="contact-card auth-card" onSubmit={submit}>
        <Eyebrow>{mode === "login" ? "welcome back" : "join folio"}</Eyebrow>
        <h1>{mode === "login" ? "Log in" : "Create an account"}</h1>
        {mode === "register" && (
          <div className="two-fields">
            <label>First name<input required value={form.first_name} onChange={set("first_name")} /></label>
            <label>Last name<input value={form.last_name} onChange={set("last_name")} /></label>
          </div>
        )}
        <label>Email<input required type="email" value={form.email} onChange={set("email")} /></label>
        <label>Password<input required type="password" value={form.password} onChange={set("password")} /></label>
        {error && <p className="err">{error}</p>}
        <button className="btn btn-primary block" disabled={busy}>{mode === "login" ? "Log in" : "Sign up"}</button>
        <p className="muted center">
          {mode === "login" ? <>New here? <Link to="/register" state={{ from }}>Create an account</Link></> : <>Have an account? <Link to="/login" state={{ from }}>Log in</Link></>}
        </p>
      </form>
    </section>
  );
}
