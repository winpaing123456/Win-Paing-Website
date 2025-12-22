import React, { useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function validateForm() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    else if (form.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email)) newErrors.email = "Please enter a valid email address";
    if (!form.message.trim()) newErrors.message = "Message is required";
    else if (form.message.trim().length < 10) newErrors.message = "Message must be at least 10 characters";
    return newErrors;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { 
      setErrors(newErrors); 
      return; 
    }

    setSending(true);
    setErrors({});

    try {
      // Prepare data to send to backend email route
      const contactData = {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim()
      };

      // Send to backend email route
      const res = await fetch(`${API_BASE}/api/contact/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(contactData),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send message');
      }

      // Success - reset form and show success message
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });

      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Contact form send error:', err);
      setErrors({ 
        form: typeof err === 'string' 
          ? err 
          : (err.message || 'Failed to send message. Please try again later.') 
      });
    } finally {
      setSending(false);
    }
  }

  const isFormValid = form.name.trim().length >= 2 && isValidEmail(form.email) && form.message.trim().length >= 10;

  return (
    <div className="section fade-in" id="contact">
      <h2 className="section-heading">Contact</h2>
      <p className="section-subtext">
        Have a project, question, or just want to chat? Send me a message and I'll get back to you as soon as possible.
      </p>

      <div className="contact-box">
        {submitted && (
          <div className="success-message">
            <i className="ri-check-circle-line"></i>
            <div>
              <p className="success-title">Message sent successfully!</p>
              <p className="success-text">Thanks for reaching out. I'll reply soon.</p>
            </div>
          </div>
        )}

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="form-error form-error-global" role="alert">{errors.form}</div>}
          <div className="form-group">
            <label htmlFor="contact-name" className="form-label">Full Name</label>
            <input id="contact-name" type="text" placeholder="Your full name"  autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
               className={`form-input ${errors.name ? "input-error" : ""}`} value={form.name} maxLength="50" onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors((prev) => ({ ...prev, name: null })); }} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
            <div className="form-meta">
              <span className="char-count">{form.name.length}/50</span>
              {errors.name && <span id="name-error" className="form-error">{errors.name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contact-email" className="form-label">Email Address</label>
            <input id="contact-email" type="email" placeholder="your@email.com"  autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off" className={`form-input ${errors.email ? "input-error" : ""}`} value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors((prev) => ({ ...prev, email: null })); }} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
            {errors.email && <span id="email-error" className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contact-message" className="form-label">Message</label>
            <textarea id="contact-message" placeholder="Tell me about your project, question, or just say hi..."  autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off" className={`form-input form-textarea ${errors.message ? "input-error" : ""}`} value={form.message} maxLength="1000" onChange={(e) => { setForm({ ...form, message: e.target.value }); if (errors.message) setErrors((prev) => ({ ...prev, message: null })); }} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />
            <div className="form-meta">
              <span className="char-count">{form.message.length}/1000</span>
              {errors.message && <span id="message-error" className="form-error">{errors.message}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={!isFormValid || sending} aria-label="Send your message">
              <i className={sending ? "ri-loader-line" : "ri-send-plane-2-line"}></i>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setForm({ name: "", email: "", message: "" }); setErrors({}); }}>
              <i className="ri-refresh-line"></i>
              Clear
            </button>
          </div>
        </form>

        <div className="contact-info">
          <p className="contact-info-text">
            <i className="ri-mail-line"></i>
            For urgent matters, you can also <a href="mailto:winpaingse25@gmail.com">email me directly</a> at <strong>winpaingse25@gmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
