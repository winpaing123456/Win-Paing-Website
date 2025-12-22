
import React, { useEffect, useState } from "react";

// API base URL and admin password
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS || "winpaing";

export default function ProjectSection() {
  // State for projects, admin, form, and errors
  const [projects, setProjects] = useState([]);
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    tech_stack: "",
    live_url: "",
    repo_url: "",
    image: null,
    imagePreview: null,
  });

  // Load projects from backend or fallback to demo
  useEffect(() => {
    let mounted = true;
    async function fetchProjects() {
      try {
        const res = await fetch(`${API_BASE}/api/projects`);
        if (res.ok) {
          const data = await res.json();
          if (!mounted) return;
          setProjects(
            data.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              tech_stack: p.tech_stack,
              live_url: p.live_url,
              repo_url: p.repo_url,
              imagePreview: p.image_url ? `${API_BASE}${p.image_url}` : null,
            }))
          );
          return;
        }
      } catch (e) {
        // ignore and fallback
      }
      // Fallback demo data
      if (!mounted) return;
      setProjects([
        { id: 1, title: "My Project", description: "Short description", imagePreview: "/demo1.jpg" },
        { id: 2, title: "Portfolio", description: "Personal portfolio", imagePreview: "/demo2.jpg" },
        { id: 3, title: "Web App", description: "A web application", imagePreview: "/demo3.jpg" },
      ]);
    }
    fetchProjects();
    return () => { mounted = false; };
  }, []);

  // Handle image file input
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ image: "Image must be <10MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, image: file, imagePreview: ev.target.result }));
    reader.readAsDataURL(file);
  }

  // Handle form field changes
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // Admin login
  function handleAdminSubmit(e) {
    e?.preventDefault();
    setErrors({});
    if (!password) {
      setErrors({ pass: "Enter password" });
      return;
    }
    if (password !== ADMIN_PASS) {
      setErrors({ pass: "Incorrect admin password" });
      return;
    }
    setIsAdmin(true);
  }

  // Add a new project
  async function handleAddProject(e) {
    e.preventDefault();
    setErrors({});
    if (!form.title.trim()) {
      setErrors({ form: "Title is required" });
      return;
    }
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("tech_stack", form.tech_stack);
      fd.append("live_url", form.live_url);
      fd.append("repo_url", form.repo_url);
      if (form.image) fd.append("image", form.image);

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        body: fd,
        headers: {
          "x-admin-password": password
        },
      });

      if (res.ok) {
        const created = await res.json();
        setProjects((prev) => [
          {
            id: created.id || Date.now(),
            title: created.title,
            description: created.description,
            tech_stack: created.tech_stack,
            live_url: created.live_url,
            repo_url: created.repo_url,
            imagePreview: created.image_url ? `${API_BASE}${created.image_url}` : form.imagePreview,
          },
          ...prev,
        ]);
        setForm({ title: "", description: "", tech_stack: "", live_url: "", repo_url: "", image: null, imagePreview: null });
        return;
      }
    } catch (err) {
      // fallback below
    }
    // Fallback: add locally
    setProjects((prev) => [
      { id: Date.now(), title: form.title, description: form.description, imagePreview: form.imagePreview },
      ...prev,
    ]);
    setForm({ title: "", description: "", tech_stack: "", live_url: "", repo_url: "", image: null, imagePreview: null });
  }

  // Delete project (with confirm)
  function requestDelete(id) {
    setPendingDelete(id);
  }
  function cancelDelete() {
    setPendingDelete(null);
  }
  async function handleDeleteConfirm(id) {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": password
        },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setPendingDelete(null);
        return;
      } else {
        // Optionally handle error response from backend
        const errData = await res.json().catch(() => ({}));
        setErrors({ delete: errData.error || "Failed to delete project" });
      }
    } catch (err) {
      setErrors({ delete: "Network error deleting project" });
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setPendingDelete(null);
  }

  // UI rendering
  return (
    <div className="section fade-in" id="project">
      <h2 className="section-heading">Projects</h2>

      <div className="project-box">
        {/* Admin login form */}
        <form className="admin-login" onSubmit={handleAdminSubmit} style={{ maxWidth: 500, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <label className="form-label" htmlFor="admin-pass" style={{ fontWeight: 600, fontSize: 16, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>Admin Password</label>
            <input
              id="admin-pass"
              type={showPassword ? "text" : "password"}
              name="admin-pass"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              style={{ height: 40, fontSize: 15, flex: 1, marginRight: 0 }}
            />
            <button type="button" className="btn-secondary" onClick={() => setShowPassword((s) => !s)} style={{ padding: '8px 24px', fontWeight: 600, fontSize: 15 }}>{showPassword ? 'Hide' : 'Show'}</button>
            <button type="submit" className="btn-secondary" style={{ padding: '8px 24px', fontWeight: 600, fontSize: 15 }}>Login</button>
            {isAdmin && <span style={{ color: "#6ee7b7", marginLeft: 10, fontWeight: 600 }}>Admin</span>}
          </div>
          {errors.pass && <div className="form-error" style={{ marginTop: 8 }}>{errors.pass}</div>}
        </form>

        {/* Admin project form */}
        {isAdmin && (
          <form className="project-admin card" onSubmit={handleAddProject} style={{ marginTop: 16 }}>
            <h3>Create Project</h3>
            <div className="form-grid">
              <input name="title" className="form-input" placeholder="Title" value={form.title} onChange={handleChange} required />
              <input name="tech_stack" className="form-input" placeholder="Tech stack (comma)" value={form.tech_stack} onChange={handleChange} required />
              <input name="live_url" className="form-input" placeholder="Live URL" value={form.live_url} onChange={handleChange} required />
              <input name="repo_url" className="form-input" placeholder="Repo URL" value={form.repo_url} onChange={handleChange} required />
            </div>
            <textarea name="description" className="form-input form-textarea" placeholder="Short description" value={form.description} onChange={handleChange} required />

            <label className="upload-box">
              {form.imagePreview ? <img src={form.imagePreview} alt="preview" style={{ maxWidth: 160, borderRadius: 8 }} /> : "Upload image"}
              <input type="file" accept="image/*" onChange={handleImageChange} required hidden />
            </label>

            <div style={{ marginTop: 10 }}>
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setForm({ title: "", description: "", tech_stack: "", live_url: "", repo_url: "", image: null, imagePreview: null })} style={{ marginLeft: 8 }}>Clear</button>
              {errors.form && <div className="form-error">{errors.form}</div>}
            </div>
          </form>
        )}

        {/* Projects grid */}
        <div className="project-grid" style={{ marginTop: 18 }}>
          {projects.length === 0 ? (
            <div className="empty">No projects yet</div>
          ) : (
            projects.map((p) => (
              <article key={p.id} className="project-card card">
                {p.imagePreview && <div className="project-image"><img src={p.imagePreview} alt={p.title} /></div>}
                <div className="project-body">
                  <h4 className="project-title-sm">{p.title}</h4>
                  <p className="project-desc">{p.description}</p>
                  <div className="project-meta">
                    <span>{p.tech_stack}</span>
                    <div>
                      {p.live_url && <a className="btn-small" href={p.live_url} target="_blank" rel="noreferrer">View</a>}
                      {p.repo_url && <a className="btn-small" style={{ marginLeft: 8 }} href={p.repo_url} target="_blank" rel="noreferrer">Repo</a>}
                      {isAdmin && (
                        pendingDelete === p.id ? (
                          <span>
                            <button className="btn-small" onClick={() => handleDeleteConfirm(p.id)}>Confirm</button>
                            <button className="btn-small" style={{ marginLeft: 8 }} onClick={cancelDelete}>Cancel</button>
                          </span>
                        ) : (
                          <button className="delete-btn" style={{ marginLeft: 8 }} onClick={() => requestDelete(p.id)}>Delete</button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

