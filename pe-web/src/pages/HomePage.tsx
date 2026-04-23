import { Link } from "react-router-dom";
import "./HomePage.css";

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
            <img
              src="/logo.jpeg"
              alt="Pulpito Esports"
              className="home-brand-logo"
            />
            <div className="home-brand-text">
              <span className="home-brand-name">Pulpito</span>
              <span className="home-brand-sub">Esports</span>
            </div>
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
            <span className="badge badge-orange">
              Liga Oficial · Temporada 2025
            </span>
          </div>

          <img
            src="/logo.jpeg"
            alt="Pulpito Esports"
            className="hero-logo fade-in"
          />

          <h1 className="hero-title fade-in-delay-1">
            Competí en la
            <br />
            <span className="gradient-text">Liga Pulpito</span>
          </h1>

          <p className="hero-subtitle fade-in-delay-2">
            La plataforma oficial de torneos y ligas de League of Legends.
            <br />
            Registrá tu cuenta, vinculá tu Riot ID y empezá a competir.
          </p>

          <div className="hero-actions fade-in-delay-3">
            <Link to="/register" className="btn btn-primary btn-lg">
              Unirme ahora
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
              <span className="stat-label">Equipos</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
