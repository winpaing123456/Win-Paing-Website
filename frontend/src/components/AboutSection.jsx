// src/components/AboutSection.jsx
import React from "react";
import aboutPhoto from "../assets/win.png"; // 👉 put your image here

export default function AboutSection() {
  return (
    <div className="section fade-in" id="about">
      <h2 className="section-heading">About Me</h2>

      <div className="about-layout">
        {/* LEFT: image frame */}
        <div className="about-photo-frame">
          <div className="about-photo-inner">
            <img
              src={aboutPhoto}
              alt="Win Arkar Paing"
              className="about-photo-img"
            />
          </div>
        </div>

        {/* RIGHT: text */}
        <div className="about-copy">
          <p className="about-text">
            Hi, I’m <span className="about-highlight">Win Arkar Paing</span>.
            I’m a beginner web developer learning how to build modern, animated
            websites using React, Node.js and PostgreSQL.
          </p>

          <p className="about-text">
            I enjoy practicing front-end design, trying new UI/UX ideas, and
            creating small projects that feel smooth and user-friendly.
          </p>

          <p className="about-text">
            This portfolio is part of my learning journey. I’m improving step by
            step, building better projects and learning real-world development
            skills along the way.
          </p>
        </div>
      </div>
    </div>
  );
}
