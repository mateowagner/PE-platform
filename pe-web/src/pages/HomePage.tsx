import { Link } from "react-router-dom";
import "./HomePage.css";

const OctopusHero = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="hero-octopus"
  >
    <circle cx="60" cy="48" r="28" fill="url(#hero-grad)" />
    <ellipse cx="60" cy="50" rx="12" ry="14" fill="#0d0d0f" opacity="0.25" />
    <circle cx="51" cy="43" r="5" fill="white" opacity="0.95" />
    <circle cx="69" cy="43" r="5" fill="white" opacity="0.95" />
    <circle cx="52" cy="42" r="2.2" fill="#1a0a2e" />
    <circle cx="70" cy="42" r="2.2" fill="#1a0a2e" />
    <circle cx="53" cy="41" r="0.8" fill="white" opacity="0.6" />
    <circle cx="71" cy="41" r="0.8" fill="white" opacity="0.6" />
    <path
      d="M32 72 Q24 82 28 94 Q32 102 37 94 Q41 86 36 78"
      stroke="url(#hero-grad)"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M43 78 Q38 90 42 101 Q46 109 51 101 Q54 93 49 82"
      stroke="url(#hero-grad)"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M55 80 Q54 93 56 104 Q58 112 62 104 Q65 96 62 84"
      stroke="url(#hero-grad)"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M67 78 Q68 91 72 101 Q76 109 80 101 Q82 93 78 82"
      stroke="url(#hero-grad)"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M78 72 Q84 82 84 94 Q84 102 89 94 Q93 86 88 78"
      stroke="url(#hero-grad)"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient
        id="hero-grad"
        x1="0"
        y1="0"
        x2="120"
        y2="120"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#9d4edd" />
        <stop offset="100%" stopColor="#00d4ff" />
      </linearGradient>
    </defs>
  </svg>
);

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-bg">
        <div className="bg-image" />
        <div className="bg-overlay" />
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-brand">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="13" r="7" fill="url(#nav-g)" />
              <circle cx="13.5" cy="11.5" r="1.2" fill="white" opacity="0.9" />
              <circle cx="18.5" cy="11.5" r="1.2" fill="white" opacity="0.9" />
              <path
                d="M9 19 Q7 22 8 25 Q9 27 10 25 Q11 23 10 21"
                stroke="url(#nav-g)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M12 20.5 Q11 24 12 27 Q13 29 14 27 Q14.5 25 13.5 22.5"
                stroke="url(#nav-g)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M16 21 Q16 25 16.5 28 Q17 30 18 28 Q18.5 26 17.5 23"
                stroke="url(#nav-g)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M19.5 20.5 Q21 24 20.5 27 Q20 29 19 27 Q18.5 25 19 22.5"
                stroke="url(#nav-g)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M23 19 Q25 22 24 25 Q23 27 22 25 Q21 23 22 21"
                stroke="url(#nav-g)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="nav-g"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#9d4edd" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
            <span className="home-brand-text">
              PE<span>Platform</span>
            </span>
          </div>
          <div className="home-header-actions">
            <Link to="/login" className="btn btn-ghost">
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn btn-primary">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="home-hero">
        <div className="hero-content">
          <div className="hero-badge fade-in">
            <span className="badge badge-violet">Liga Pulpito Esports</span>
          </div>

          <OctopusHero />

          <h1 className="hero-title fade-in-delay-1">
            Bienvenido a la
            <br />
            <span className="gradient-text">Arena Competitiva</span>
          </h1>

          <p className="hero-subtitle fade-in-delay-2">
            La plataforma oficial de torneos y ligas de League of Legends.
            <br />
            Registrá tu cuenta, formá tu equipo y competí.
          </p>

          <div className="hero-actions fade-in-delay-3">
            <Link to="/register" className="btn btn-primary btn-lg">
              Comenzar ahora
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Ya tengo cuenta
            </Link>
          </div>

          <div className="hero-stats fade-in-delay-3">
            <div className="stat-item">
              <span className="stat-value gradient-text">500+</span>
              <span className="stat-label">Jugadores</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value gradient-text">48</span>
              <span className="stat-label">Torneos</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value gradient-text">12</span>
              <span className="stat-label">Equipos activos</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
