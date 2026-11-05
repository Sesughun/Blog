import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../types";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");

  function search(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/topics/all?q=${encodeURIComponent(q.trim())}`);
    setSearching(false);
    setQ("");
  }

  return (
    <header className="site-header">
      <div className="container bar">
        <Link to="/" className="logo">folio<span>.</span></Link>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/topics">Topics</NavLink>
          <NavLink to="/writers">Writers</NavLink>
          <NavLink to="/about">About</NavLink>
          {searching ? (
            <form onSubmit={search}><input autoFocus className="search-input" placeholder="Search stories" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setSearching(false)} /></form>
          ) : (
            <button className="icon-btn" aria-label="Search" onClick={() => setSearching(true)}>⌕</button>
          )}
          {user ? (
            <>
              {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
              {user.role !== "reader" && <NavLink to="/dashboard">Write</NavLink>}
              <NavLink to="/saved">Saved</NavLink>
              <button className="link-btn" onClick={() => logout().then(() => navigate("/"))}>Log out ({user.first_name || user.name})</button>
            </>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
          <Link to="/#newsletter" className="btn btn-primary btn-sm">Subscribe</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container bar">
        <Link to="/" className="logo">folio<span>.</span></Link>
        <nav>
          <Link to="/about">About</Link>
          <Link to="/topics">Topics</Link>
          <Link to="/#newsletter">Newsletter</Link>
          <Link to="/about#contact">Contact</Link>
        </nav>
        <small>© {new Date().getFullYear()} Folio</small>
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname, hash } = useLocation();
  // Scroll to the anchor if there is one, otherwise to the top on navigation.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}

export function RequireRole({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="state">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
