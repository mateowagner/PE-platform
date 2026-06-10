import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import "./Navbar.css";
import NotificationBell from "../NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-brand">
          <img src="/logo.jpeg" alt="Pulpito Esports" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">Pulpito</span>
            <span className="brand-sub">Esports</span>
          </div>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/tournaments"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Torneos
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Equipo
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Cuenta
          </NavLink>
          <a href="#" className="nav-link">
            Amigos
          </a>
          <a href="#" className="nav-link">
            Configuración
          </a>
        </div>

        {/* Bloque de Usuario del extremo derecho */}
        <div className="navbar-user">
          {/* --- LA CAMPANITA CLAVADA JUSTO ACÁ --- */}
          <div className="navbar-bell-container">
            <NotificationBell />
          </div>

          <div className="user-chip">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <span className="user-name">{user?.username}</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
