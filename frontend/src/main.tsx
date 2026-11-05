import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";
import { Layout, RequireRole } from "./components/Layout";
import About from "./pages/About";
import Admin from "./pages/Admin";
import AuthPage from "./pages/Auth";
import { Dashboard, Editor, ProfileEditor } from "./pages/Dashboard";
import Home from "./pages/Home";
import Post from "./pages/Post";
import Saved from "./pages/Saved";
import { Topic, TopicsIndex } from "./pages/Topics";
import { WriterProfile, WritersIndex } from "./pages/Writers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="topics" element={<TopicsIndex />} />
            <Route path="topics/:slug" element={<Topic />} />
            <Route path="writers" element={<WritersIndex />} />
            <Route path="writers/:id" element={<WriterProfile />} />
            <Route path="post/:slug" element={<Post />} />
            <Route path="about" element={<About />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />

            <Route element={<RequireRole />}>
              <Route path="saved" element={<Saved />} />
            </Route>
            <Route element={<RequireRole roles={["writer", "admin"]} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard/new" element={<Editor />} />
              <Route path="dashboard/edit/:slug" element={<Editor />} />
              <Route path="dashboard/profile" element={<ProfileEditor />} />
            </Route>
            <Route element={<RequireRole roles={["admin"]} />}>
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<p className="state">Page not found.</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
