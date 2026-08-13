import { Link } from "react-router-dom";
import "./HomePage.css";
import "../components/icons/AuthIcons";
import { Callendar, Trophy } from "../components/icons/AuthIcons";
export default function HomePage() {
  return (
    <div className="landing-container">
      {/* 1. Header / Navbar Flotante (Sin menú central) */}
      <header className="navbar-floating">
        <div className="navbar-logo">
          <img src="/logo.jpeg" alt="Liga Pulpito" className="logo-glow" />
          <span className="brand-name">LIGA PULPITO</span>
        </div>
        <div className="navbar-actions">
          <Link to="/login" className="btn-outline">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="btn-neon">
            Registrarse
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-glow">CIRCUTO COMPETITIVO AMATEUR</span>
        </div>

        <h1 className="hero-title">
          Viví la experiencia de{" "}
          <span className="text-highlight">competir como un profesional</span>
        </h1>

        <p className="hero-description">
          Somos un grupo de amigos apasionados por el League of Legends con un
          objetivo claro: ofrecer un circuito competitivo real con tablas de
          posiciones, calendarios, ascensos y descensos, premios y gestión de
          rosters.
        </p>

        <Link to="/register" className="btn-hero-cta">
          Inscribir a mi equipo
        </Link>
      </section>

      {/* 3. Tarjetas de Formatos de Torneo */}
      <section className="formats-section">
        <div className="section-header">
          <span className="section-tag">COMPETENCIA</span>
          <h2>Formatos de Torneo</h2>
        </div>

        <div className="formats-grid">
          {/* Tarjeta Formato Liga */}
          <div className="glass-card format-card league-card">
            <div className="card-header-badge">
              <Callendar />
            </div>
            <h3>Formato Liga</h3>
            <p>
              Fase regular, todos contra todos manteniendo una tabla en tiempo
              real dividida en jornadas. Al fin de cada temporada habrá ascensos
              y descensos entre divisiones para mantener una competitividad real
              según tu nivel de juego.
            </p>
          </div>

          {/* Tarjeta Torneos Clásicos */}
          <div className="glass-card format-card cup-card">
            <div className="card-header-badge">
              <Trophy />
            </div>
            <h3>Torneos Clásicos</h3>
            <p>
              Bracket de eliminación directa Bo3 para competiciones rápidas de
              fin de semana, ideal para medir el nivel de tu equipo en un
              entorno real y competitivo.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Nuestra Misión / Filosofía Reestructurada */}
      <section className="philosophy-section">
        <div className="glass-card mission-banner">
          <div className="mission-content">
            <h2>Nuestra Propuesta</h2>
            <p className="mission-lead">
              Buscamos crear la mejor experiencia competitiva para jugadores y
              equipos amateurs de League of Legends, ofreciendo un entorno
              justo, organizado y profesional.
            </p>
          </div>

          <div className="philosophy-grid">
            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h4>Competencia Leal</h4>
                <p>Emparejamientos nivelados y control estricto de rosters.</p>
              </div>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h4>Desde Tu Casa</h4>
                <p>Toda la organización de fechas y brackets 100% online.</p>
              </div>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff6b1a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h4>Progreso Real</h4>
                <p>Seguimiento de estadísticas, historial y progreso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
