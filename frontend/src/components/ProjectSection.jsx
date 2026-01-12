
import React, { useEffect, useState } from "react";

// Determine API base URL
// In production on Render, set REACT_APP_API_BASE to your backend URL (e.g., https://your-backend.onrender.com)
function getApiBase() {
  if (process.env.REACT_APP_API_BASE) {
    const apiBase = process.env.REACT_APP_API_BASE;
    console.log('Using REACT_APP_API_BASE from environment:', apiBase);
    return apiBase;
  }
  
  // Auto-detect: if frontend is on Render, try to guess backend URL
  if (window.location.hostname.includes('render.com')) {
    // Try common Render backend URL pattern
    // You should set REACT_APP_API_BASE in Render's environment variables instead
    console.warn('⚠️ REACT_APP_API_BASE not set. Please set it in Render environment variables.');
    console.warn('   Current location:', window.location.href);
    console.warn('   Images may not load correctly without the correct backend URL.');
  }
  
  const fallback = 'http://localhost:5000';
  console.log('Using fallback API_BASE:', fallback);
  return fallback; // Fallback for local development
}

const API_BASE = getApiBase();
console.log('API_BASE initialized:', API_BASE);
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

  // Helper function to construct image URL
  function getImageUrl(imagePath) {
    if (!imagePath) return null;
    
    // If imagePath already starts with http:// or https://, use it as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Otherwise, prepend API_BASE
    // Ensure imagePath starts with / if it doesn't
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const fullUrl = `${API_BASE}${normalizedPath}`;
    
    // Log for debugging
    console.log('Project Image URL constructed:', { imagePath, API_BASE, fullUrl });
    
    return fullUrl;
  }

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
              imagePreview: getImageUrl(p.image_url),
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
            imagePreview: getImageUrl(created.image_url) || form.imagePreview,
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
        <form className="admin-login" onSubmit={handleAdminSubmit}>
          <div className="admin-login-row">
            <label className="form-label admin-label" htmlFor="admin-pass">Admin Password</label>
            <input
              id="admin-pass"
              type={showPassword ? "text" : "password"}
              name="admin-pass"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input admin-input"
            />
            <button type="button" className="btn-toggle" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
            <button type="submit" className="btn-login">Login</button>
            {isAdmin && <span className="admin-badge">✓ Admin</span>}
          </div>
          {errors.pass && <div className="form-error admin-error">{errors.pass}</div>}
        </form>

        {/* Admin project form */}
        {isAdmin && (
          <form className="project-admin card" onSubmit={handleAddProject}>
            <h3 className="project-form-title">Create Project</h3>
            <div className="form-grid">
              <input name="title" className="form-input" placeholder="Title" value={form.title} onChange={handleChange} required />
              <input name="tech_stack" className="form-input" placeholder="Tech stack (comma)" value={form.tech_stack} onChange={handleChange} required />
              <input name="live_url" className="form-input" placeholder="Live URL" value={form.live_url} onChange={handleChange} required />
              <input name="repo_url" className="form-input" placeholder="Repo URL" value={form.repo_url} onChange={handleChange} required />
            </div>
            <textarea name="description" className="form-input form-textarea" placeholder="Short description" value={form.description} onChange={handleChange} required />

            <label className="upload-box project-upload">
              {form.imagePreview ? <img src={form.imagePreview} alt="preview" className="upload-preview" /> : <span className="upload-text">📷 Upload image</span>}
              <input type="file" accept="image/*" onChange={handleImageChange} required hidden />
            </label>

            <div className="project-form-actions">
              <button type="submit" className="btn-primary project-create-btn">Create</button>
              <button type="button" className="btn-secondary project-clear-btn" onClick={() => setForm({ title: "", description: "", tech_stack: "", live_url: "", repo_url: "", image: null, imagePreview: null })}>Clear</button>
              {errors.form && <div className="form-error project-form-error">{errors.form}</div>}
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
                {p.imagePreview && (
                  <div className="project-image">
                    <img 
                      src={p.imagePreview} 
                      alt={p.title}
                      onError={(e) => {
                        console.error('Failed to load project image:', {
                          url: p.imagePreview,
                          apiBase: API_BASE
                        });
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Successfully loaded project image:', p.imagePreview);
                      }}
                    />
                  </div>
                )}
                <div className="project-body">
                  <h4 className="project-title-sm">{p.title}</h4>
                  <p className="project-desc">{p.description}</p>
                  <div className="project-meta">
                    <span className="project-tech">{p.tech_stack}</span>
                    <div className="project-actions">
                      {p.live_url && <a className="btn-small btn-view" href={p.live_url} target="_blank" rel="noreferrer">View</a>}
                      {p.repo_url && <a className="btn-small btn-repo" href={p.repo_url} target="_blank" rel="noreferrer">Repo</a>}
                      {isAdmin && (
                        pendingDelete === p.id ? (
                          <span className="delete-confirm-group">
                            <button className="btn-small btn-confirm" onClick={() => handleDeleteConfirm(p.id)}>Confirm</button>
                            <button className="btn-small btn-cancel" onClick={cancelDelete}>Cancel</button>
                          </span>
                        ) : (
                          <button className="delete-btn project-delete-btn" onClick={() => requestDelete(p.id)}>Delete</button>
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

