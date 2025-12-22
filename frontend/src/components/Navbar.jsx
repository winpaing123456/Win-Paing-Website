import myPhoto from "../assets/uz.png"; // 👈 your logo photo

export default function Navbar({ theme, setTheme, themes }) {
  return (
    <header className="nav">
      <img className="nav-logo" src={myPhoto} alt="Win logo" />

      <nav className="nav-links">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
    
        <a href="#blog">Blog</a>
        <a href="#project">Project</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="nav-controls">
        <div className="palette-row">
          {themes.map((t) => (
            <button
              key={t}
              className={
                "palette-dot" + (theme === t ? " palette-dot--active" : "")
              }
              onClick={() => setTheme(t)}
              title={t}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
