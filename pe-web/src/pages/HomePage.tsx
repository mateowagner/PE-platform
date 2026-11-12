// pe-web/src/pages/HomePage.tsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Swords,
  Shield,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  ChevronRight,
  Flame,
  Globe2,
  Crown,
  UserCheck,
  CalendarCheck,
  Lock,
} from "lucide-react";
import "./HomePage.css";

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll reveal native
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const revealElements = document.querySelectorAll(".scroll-reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root" ref={containerRef}>
      {/* ─── NAVBAR FLOTANTE ─────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="nav-brand-box">
          <img
            src="/logo.jpeg"
            alt="Pulpito Esports"
            className="brand-avatar"
          />
          <span className="brand-title">
            PULPITO <span className="brand-title-accent">ESPORTS</span>
          </span>
        </div>

        <nav className="nav-anchors">
          <a href="#formatos" className="nav-link">
            Formatos
          </a>
          <a href="#seguridad" className="nav-link">
            Seguridad & Fair Play
          </a>
          <a href="#ecosistema" className="nav-link">
            Ecosistema
          </a>
        </nav>

        <div className="nav-cta-group">
          <Link to="/login" className="btn-nav-ghost">
            Ingresar
          </Link>
          <Link to="/register" className="btn-nav-primary">
            Crear Cuenta
          </Link>
        </div>
      </header>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="hero-viewport">
        <div className="hero-glow-back hero-glow-purple" />
        <div className="hero-glow-back hero-glow-cyan" />

        <div className="hero-content">
          <h1 className="hero-main-heading">
            DEJÁ LA SOLOQ ATRÁS.
            <br />
            <span className="heading-gradient">COMPETÍ EN EQUIPO.</span>
          </h1>

          <p className="hero-body-lead">
            La plataforma diseñada para equipos amateurs de League of Legends.
            Inscripción de rosters, estadísticas al instante y un circuito real
            donde cada partida cuenta.
          </p>

          <div className="hero-actions-cluster">
            <Link to="/register" className="btn-hero-flame">
              <Flame size={19} />
              <span>Inscribir a mi equipo</span>
            </Link>
            <Link to="/tournaments" className="btn-hero-glass">
              <span>Explorar Torneos</span>
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {/* Mockup / Live Match Preview */}
        <div className="hero-interactive-showcase scroll-reveal">
          <div className="showcase-glass-card">
            <div className="showcase-card-header">
              <div className="header-status-tag">
                <span className="live-dot" /> EN JUEGO • FINAL BO3
              </div>
              <span className="showcase-league-name">Copa Relámpago #1</span>
            </div>

            <div className="showcase-versus-row">
              <div className="showcase-team left">
                <div className="team-avatar-frame frame-purple">
                  <Shield size={24} className="text-purple" />
                </div>
                <div className="showcase-team-meta">
                  <span className="team-callsign">Los Capitos</span>
                  <span className="team-record">Fase Regular</span>
                </div>
              </div>

              <div className="showcase-scoreboard">
                <div className="score-digits">
                  <span className="score-val win">1</span>
                  <span className="score-sep">-</span>
                  <span className="score-val">0</span>
                </div>
                <span className="score-stage">MAPA 2</span>
              </div>

              <div className="showcase-team right">
                <div className="showcase-team-meta text-right">
                  <span className="team-callsign">Boca Juniors Gaming</span>
                  <span className="team-record">Finalista</span>
                </div>
                <div className="team-avatar-frame frame-cyan">
                  <Crown size={24} className="text-cyan" />
                </div>
              </div>
            </div>

            <div className="showcase-footer-stats">
              <div className="stat-quick-pill">
                <BarChart3 size={13} className="text-cyan" /> Telemetría Data
                Dragon
              </div>
              <div className="stat-quick-pill">
                <Users size={13} className="text-purple" /> Rosters Verificados
              </div>
              <div className="stat-quick-pill">
                <Globe2 size={13} className="text-orange" /> Servidor LAS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FORMATOS DE COMPETICIÓN ─────────────────────────────────────── */}
      <section
        id="formatos"
        className="section-block formats-section scroll-reveal"
      >
        <div className="section-title-wrap">
          <span className="section-eyebrow">MODOS DE JUEGO</span>
          <h2 className="section-heading">FORMATOS A LA MEDIDA DE TU EQUIPO</h2>
          <p className="section-subheading">
            Elegí cómo y cuándo competir con tu escuadra: la consistencia de una
            temporada completa o la adrenalina de una copa de fin de semana.
          </p>
        </div>

        <div className="formats-dual-grid">
          {/* Card Formato Liga */}
          <div className="format-luxury-card league-theme">
            <div className="card-top-icon-row">
              <div className="icon-cube cube-cyan">
                <Trophy size={26} />
              </div>
              <span className="format-badge-flag">TEMPORADA COMPLETA</span>
            </div>

            <h3 className="format-card-title">Liga Regular & Playoffs</h3>
            <p className="format-card-desc">
              Formato todos contra todos con fechas fijas todas las semanas.
              Sistema de ascensos y descensos por división para mantener una
              competencia siempre justa y desafiante, culminando con llaves de
              Playoffs y premios para los equipos campeones.
            </p>

            <ul className="format-feature-list">
              <li>• Calendario con fechas programadas con anticipación</li>
              <li>• Tablas de posiciones actualizadas al instante</li>
              <li>• Análisis de rivales previo a cada jornada</li>
              <li>• Progresión constante para dominar el circuito</li>
            </ul>

            <div className="card-ambient-blur ambient-cyan" />
          </div>

          {/* Card Torneos Eliminatorios */}
          <div className="format-luxury-card cup-theme">
            <div className="card-top-icon-row">
              <div className="icon-cube cube-purple">
                <Swords size={26} />
              </div>
              <span className="format-badge-flag">ALTA PRESIÓN</span>
            </div>

            <h3 className="format-card-title">Copas Eliminatorias</h3>
            <p className="format-card-desc">
              Torneos relámpago organizados durante el fin de semana a
              eliminación directa. El formato ideal para medir la frialdad y el
              draft de tu equipo en un entorno competitivo intenso sin
              comprometer meses de calendario.
            </p>

            <ul className="format-feature-list">
              <li>• Un Clash mejorado y más frecuente</li>
              <li>• Formatos variables para mayor dinamismo</li>
              <li>• Filtros por divisiones para una competencia justa</li>
              <li>• Bracket visual interactivo en tiempo real</li>
            </ul>

            <div className="card-ambient-blur ambient-purple" />
          </div>
        </div>
      </section>

      {/* ─── APARTADO: SEGURIDAD, FAIR PLAY Y ANTI-SMURF ─────────────────── */}
      <section
        id="seguridad"
        className="section-block security-section scroll-reveal"
      >
        <div className="security-glass-box">
          <div className="security-header-center">
            <span className="section-eyebrow">INTEGRIDAD COMPETITIVA</span>
            <h2 className="section-heading">
              COMPETENCIA LIMPIA, SIN EXCUSAS NI SMURFS
            </h2>
            <p className="security-lead">
              El mayor problema del competitivo amateur son las cuentas
              secundarias y los equipos desbalanceados. Diseñamos un sistema
              estricto para asegurar partidas justas.
            </p>
          </div>

          <div className="security-pillars-grid">
            <div className="security-pillar-card">
              <div className="pillar-icon text-cyan">
                <UserCheck size={26} />
              </div>
              <h4>Vinculación Obligatoria de Riot ID</h4>
              <p>
                Cada jugador debe vincular su cuenta principal mediante Riot ID.
                Verificamos historial y MMR directamente con la API oficial para
                evitar registros fantasmas.
              </p>
            </div>

            <div className="security-pillar-card">
              <div className="pillar-icon text-purple">
                <ShieldCheck size={26} />
              </div>
              <h4>Filtro y Control Anti-Smurf</h4>
              <p>
                Algoritmos de monitoreo de nivel de cuenta, cantidad de partidas
                jugadas y consistencia de elo para asegurar que nadie compita
                por debajo de su nivel real.
              </p>
            </div>

            <div className="security-pillar-card">
              <div className="pillar-icon text-orange">
                <Lock size={26} />
              </div>
              <h4>Rosters Fijos y Bloqueo de Cuentas</h4>
              <p>
                Se prohíben préstamos de cuentas o ingresos imprevistos durante
                la serie. Los 5 titulares deben estar validados en plataforma
                previo al match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN: ECOSISTEMA Y GESTIÓN ────────────────────────────────── */}
      <section
        id="ecosistema"
        className="section-block experience-section scroll-reveal"
      >
        <div className="experience-glass-box">
          <div className="experience-copy-side">
            <span className="section-eyebrow">ECOSISTEMA PROFESIONAL</span>
            <h2 className="section-heading">
              TODO LO QUE TU CLUB NECESITA PARA CRECER
            </h2>
            <p className="experience-body">
              Sabemos lo frustrante que es coordinar torneos en hojas de cálculo
              o servidores desorganizados de Discord. En Pulpito centralizamos
              la gestión completa de tu carrera amateur.
            </p>

            <div className="perks-v-list">
              <div className="perk-item">
                <div className="perk-icon-wrap">
                  <Zap size={20} className="text-orange" />
                </div>
                <div>
                  <h4 className="perk-title">Telemetría Riot Data Dragon</h4>
                  <p className="perk-desc">
                    Scoreboard post-partido horizontal estilo OP.GG con KDA,
                    daño total a campeones, oro, inventario completo y baratijas
                    en vivo.
                  </p>
                </div>
              </div>

              <div className="perk-item">
                <div className="perk-icon-wrap">
                  <Shield size={20} className="text-cyan" />
                </div>
                <div>
                  <h4 className="perk-title">Gestión de Equipo & Suplentes</h4>
                  <p className="perk-desc">
                    Logo de equipo, reclutamiento por Riot ID, alineación de
                    titulares y declaración de rosters para cada mapa.
                  </p>
                </div>
              </div>

              <div className="perk-item">
                <div className="perk-icon-wrap">
                  <CalendarCheck size={20} className="text-purple" />
                </div>
                <div>
                  <h4 className="perk-title">
                    Seguimiento de Racha & Historial
                  </h4>
                  <p className="perk-desc">
                    Revisá los últimos enfrentamientos de cualquier rival antes
                    de jugar y prepará el draft con información certera.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANNER FINAL CTA ─────────────────────────────────────────────── */}
      <section className="cta-closing-banner scroll-reveal">
        <div className="closing-banner-inner">
          <div className="closing-glow" />
          <h2 className="closing-title">
            ¿TU EQUIPO ESTÁ LISTO PARA EL DESAFÍO?
          </h2>
          <p className="closing-sub">
            Inscripciones abiertas para las próximas ligas y copas relámpago de
            League of Legends.
          </p>
          <div className="closing-btn-wrap">
            <Link to="/register" className="btn-hero-flame btn-large">
              <span>Inscribir a mi equipo</span>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-layout">
          <div className="footer-brand-side">
            <div className="nav-brand-box">
              <img src="/logo.jpeg" alt="Pulpito" className="brand-avatar" />
              <span className="brand-title">LIGA PULPITO</span>
            </div>
            <p className="footer-tagline">
              El circuito competitivo amateur de League of Legends. Hecho por y
              para la comunidad.
            </p>
          </div>

          <div className="footer-links-side">
            <span className="footer-col-title">Plataforma</span>
            <Link to="/tournaments" className="footer-link">
              Torneos
            </Link>
            <Link to="/team" className="footer-link">
              Mi Equipo
            </Link>
            <Link to="/login" className="footer-link">
              Acceso Capitanes
            </Link>
          </div>
        </div>

        <div className="footer-legal-bar">
          <p>
            © {new Date().getFullYear()} Pulpito Esports. League of Legends y
            Riot Games son marcas registradas de Riot Games, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
