// src/components/BlogSection.jsx


import React, { useState, useEffect } from "react";

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

// Format date to readable string
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
  console.log('Image URL constructed:', { imagePath, API_BASE, fullUrl });
  
  return fullUrl;
}

// Convert API post to UI post
function toPost(post) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    imagePreview: getImageUrl(post.image),
    createdAt: formatDate(post.created_at),
  };
}

export default function BlogSection() {
  // State for posts and form
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", image: null, imagePreview: null });
  const [errors, setErrors] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Load blog posts from server
  useEffect(() => {
    console.log('Fetching blogs from:', `${API_BASE}/api/blogs`);
    fetch(`${API_BASE}/api/blogs`)
      .then((res) => {
        console.log('Blogs API response status:', res.status);
        return res.json();
      })
      .then((data) => {
        console.log('Blogs data received:', data);
        const posts = data.map(toPost);
        console.log('Processed posts:', posts);
        setPosts(posts);
      })
      .catch((err) => {
        console.error('Error fetching blogs:', err);
      });
  }, []);

  // Handle image file input
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image size must be less than 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((f) => ({ ...f, image: file, imagePreview: event.target.result }));
      setErrors((prev) => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  }

  // Validate form fields
  function validateForm() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.content.trim()) newErrors.content = "Content is required";
    if (form.content.trim().length < 10) newErrors.content = "Content must be at least 10 characters";
    return newErrors;
  }

  // Publish a new blog post
  async function handlePublish(e) {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("content", form.content.trim());
      if (form.image) fd.append("image", form.image);
      const res = await fetch(`${API_BASE}/api/blogs`, {
        method: "POST",
        body: fd,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create post");
      setPosts((prev) => [toPost(body), ...prev]);
      setForm({ title: "", content: "", image: null, imagePreview: null });
      setErrors({});
    } catch (err) {
      setErrors({ form: err.message || "Failed to publish post" });
    }
  }

  // Delete a blog post
  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/api/blogs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete");
      }
      setPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (err) {
      setErrors({ form: err.message || "Failed to delete post" });
    }
  }

  // Admin login
  function handleAdminLogin(e) {
    e?.preventDefault();
    if (!adminPass) {
      setErrors({ form: "Enter admin password" });
      return;
    }
    if (adminPass !== "winpaing") {
      setErrors({ form: "Incorrect admin password" });
      return;
    }
    setIsAdmin(true);
    setErrors({});
  }

  // Helpers for UI
  const titleLength = form.title.length;
  const contentLength = form.content.length;
  const isFormValid = form.title.trim().length > 0 && form.content.trim().length >= 10;

  // UI rendering
  return (
    <div className="section fade-in" id="blog">
      <h2 className="section-heading">Blog</h2>

      {/* Admin login form */}
      <form className="admin-login" onSubmit={handleAdminLogin}>
        <div className="admin-login-row">
          <label htmlFor="admin-pass" className="form-label admin-label">Admin Password</label>
          <input
            id="admin-pass"
            name="admin-pass"
            type={showAdminPassword ? "text" : "password"}
            placeholder="Enter admin password"
            className="form-input admin-input"
            autoComplete="off"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
          />
          <button type="button" className="btn-toggle" onClick={() => setShowAdminPassword((s) => !s)}>
            {showAdminPassword ? "Hide" : "Show"}
          </button>
          <button type="submit" className="btn-login">Login</button>
        </div>
        {errors.form && <div className="form-error admin-error">{errors.form}</div>}
      </form>

      {/* Main blog box */}
      <div className="blog-box">
        {/* Show form if admin */}
        {isAdmin && (
          <div className="blog-form-wrapper">
            <h3 className="blog-form-label">Create a New Post</h3>
            <form className="blog-form" onSubmit={handlePublish} noValidate>
              {/* Title input */}
              <div className="form-group">
                <label htmlFor="blog-title" className="form-label">Post Title</label>
                <input
                  id="blog-title"
                  type="text"
                  placeholder="Give your post a catchy title..."
                  className={`form-input ${errors.title ? "input-error" : ""}`}
                  value={form.title}
                  maxLength="100"
                  autoComplete="off"
                  onChange={(e) => {
                    setForm((f) => ({ ...f, title: e.target.value }));
                    if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                  }}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "title-error" : undefined}
                />
                <div className="form-meta">
                  <span className="char-count">{titleLength}/100</span>
                  {errors.title && <span id="title-error" className="form-error">{errors.title}</span>}
                </div>
              </div>

              {/* Image and content */}
              <div className="blog-form-grid">
                {/* Image upload */}
                <div className="form-group blog-form-left">
                  <label htmlFor="blog-image" className="form-label">Featured Image</label>
                  <label htmlFor="blog-image" className="blog-upload-card">
                    {form.imagePreview ? (
                      <img src={form.imagePreview} alt="Post preview" className="blog-upload-preview" />
                    ) : (
                      <div className="blog-upload-placeholder">
                        <i className="ri-image-add-line"></i>
                        <span className="upload-text">Upload Photo</span>
                        <span className="upload-hint">JPG, PNG up to 5MB</span>
                      </div>
                    )}
                    <input
                      id="blog-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                      aria-label="Upload image for post"
                    />
                  </label>
                  {errors.image && <span className="form-error">{errors.image}</span>}
                  {form.imagePreview && (
                    <button
                      type="button"
                      className="btn-small-secondary"
                      onClick={() => setForm((f) => ({ ...f, image: null, imagePreview: null }))}
                    >Remove Image</button>
                  )}
                </div>

                {/* Content textarea */}
                <div className="form-group blog-form-right">
                  <label htmlFor="blog-content" className="form-label">Content</label>
                  <textarea
                    id="blog-content"
                    placeholder="Write your thoughts, story, or update here..."
                    className={`form-input form-textarea ${errors.content ? "input-error" : ""}`}
                    value={form.content}
                    maxLength="2000"
                    onChange={(e) => {
                      setForm((f) => ({ ...f, content: e.target.value }));
                      if (errors.content) setErrors((prev) => ({ ...prev, content: null }));
                    }}
                    aria-invalid={!!errors.content}
                    aria-describedby={errors.content ? "content-error" : undefined}
                  />
                  <div className="form-meta">
                    <span className="char-count">{contentLength}/2000</span>
                    {errors.content && <span id="content-error" className="form-error">{errors.content}</span>}
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={!isFormValid} aria-label="Publish your post">
                  <i className="ri-check-line"></i> Publish Post
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setForm({ title: "", content: "", image: null, imagePreview: null });
                    setErrors({});
                  }}
                >
                  <i className="ri-refresh-line"></i> Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blog posts list */}
        <div className="blog-posts-wrapper">
          {posts.length === 0 ? (
            <div className="blog-empty-state">
              <i className="ri-file-text-line"></i>
              <p>No posts yet</p>
              <span>Write your first post to get started!</span>
            </div>
          ) : (
            <div className="blog-list">
              {posts.map((post) => (
                <article key={post.id} className="blog-post-card">
                  <div className="blog-post-layout">
                    {post.imagePreview && (
                      <div className="blog-post-image-wrapper">
                        <img 
                          src={post.imagePreview} 
                          alt={post.title} 
                          className="blog-post-image"
                          onError={(e) => {
                            console.error('Failed to load blog image:', {
                              url: post.imagePreview,
                              apiBase: API_BASE,
                              originalPath: post.image
                            });
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Successfully loaded blog image:', post.imagePreview);
                          }}
                        />
                      </div>
                    )}
                    <div className="blog-post-content">
                      <h4 className="blog-post-title">{post.title}</h4>
                      <p className="blog-post-text">{post.content}</p>
                      <div className="blog-post-footer">
                        <time className="blog-post-date">{post.createdAt}</time>
                        {isAdmin && (
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDelete(post.id)}
                            aria-label={`Delete post: ${post.title}`}
                          >
                            <i className="ri-delete-bin-line"></i> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
