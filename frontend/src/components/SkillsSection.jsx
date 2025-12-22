import React from "react";

const skillGroups = [
  {
    title: "Frontend",
    items: ["React", "JavaScript (ES6+)", "HTML5", "CSS3 / "],
  },
  {
    title: "Backend",
    items: ["Node.js", "REST APIs", "PostgreSQL", "Authentication"],
  },
  {
    title: "Tools",
    items: ["Git & GitHub", "VS Code", "Figma", "Postman"],
  },
];

export default function SkillsSection() {
  return (
    <div className="section fade-in">
      <h2>Skills</h2>
      <div className="skills-grid">
        {skillGroups.map((group) => (
          <div key={group.title} className="card pop">
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
