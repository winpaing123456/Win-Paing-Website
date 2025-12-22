import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AboutSection from "./components/AboutSection";
import SkillsSection from "./components/SkillsSection";
import BlogSection from "./components/BlogSection";
import ProjectSection from "./components/ProjectSection";
import ContactSection from "./components/ContactSection";

// Use the SAME names as in CSS (and in the palette dots)
const THEMES = ["cyan", "purple", "orange", "mint", "pink"];

export default function App() {
  const [theme, setTheme] = useState("cyan");

  useEffect(() => {
    // set data-theme on <html> for CSS to read (html[data-theme="..."])
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Navbar theme={theme} setTheme={setTheme} themes={THEMES} />

      <main className="page">
        <section id="home">
          <Hero />
        </section>

        <section id="about" className="section-wrapper">
          <AboutSection />
        </section>

        <section id="skills" className="section-wrapper">
          <SkillsSection />
        </section>

        <section id="blog" className="section-wrapper">
          <BlogSection />
        </section>

        
        <section id="project" className="section-wrapper">
          <ProjectSection />
        </section>

        <section id="contact" className="section-wrapper">
          <ContactSection />
        </section>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Win Arkar Paing · Full-Stack Developer
      </footer>
    </div>
  );
}
