import myPhoto from "../assets/ui.png"; // 👈 your shirt photo

export default function Hero() {
  return (
    <section className="hero fade-in" id="home">
      <div className="row align-items-center w-100">
        {/* LEFT: text */}
        <div className="col-lg-6 col-md-7 hero-left">
          <p className="hero-small">Hi, It’s Me</p>
          <h1 className="hero-title">
            I’m <span className="hero-accent">Win Arkar Paing</span>
          </h1>
          <p className="hero-text">
            I am a web developer who loves building modern, animated websites
            with React, Node.js, and PostgreSQL.
          </p>

          <div className="hero-social">
            {/* Facebook button: goes to Facebook */}
            <a href="https://www.facebook.com/share/182GjZuB4b/" className="social-btn" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <i className="ri-facebook-circle-fill"></i>
            </a>
            {/* Instagram button: goes to Instagram */}
            <a href="https://www.instagram.com/winpaing366" className="social-btn" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <i className="ri-instagram-line"></i>
            </a>
            {/* TikTok button: goes to TikTok */}
            <a href="https://www.tiktok.com/@win.paing854" className="social-btn" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
              <i className="ri-tiktok-fill"></i>
            </a>
          </div>
        </div>

       {/* RIGHT: glowing circle avatar */}
<div className="col-lg-6 col-md-5 d-flex justify-content-center hero-right">
  <div className="hero-avatar float">
    <div className="hero-avatar-inner">
      <img
        src={myPhoto}
        alt="Win Arkar Paing"
        className="hero-avatar-img"
      />
    </div>
  </div>
</div>

      </div>

    </section>
  );
}
