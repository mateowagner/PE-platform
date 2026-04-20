import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import "./Navbar.css";

const OctopusLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="13" r="7" fill="url(#octo-grad)" />
    <circle cx="13.5" cy="11.5" r="1.2" fill="white" opacity="0.9" />
    <circle cx="18.5" cy="11.5" r="1.2" fill="white" opacity="0.9" />
    <circle cx="14" cy="11.2" r="0.5" fill="#0d0d0f" />
    <circle cx="19" cy="11.2" r="0.5" fill="#0d0d0f" />
    <path
      d="M9 19 Q7 22 8 25 Q9 27 10 25 Q11 23 10 21"
      stroke="url(#octo-grad)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M12 20.5 Q11 24 12 27 Q13 29 14 27 Q14.5 25 13.5 22.5"
      stroke="url(#octo-grad)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M16 21 Q16 25 16.5 28 Q17 30 18 28 Q18.5 26 17.5 23"
      stroke="url(#octo-grad)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M19.5 20.5 Q21 24 20.5 27 Q20 29 19 27 Q18.5 25 19 22.5"
      stroke="url(#octo-grad)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M23 19 Q25 22 24 25 Q23 27 22 25 Q21 23 22 21"
      stroke="url(#octo-grad)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient
        id="octo-grad"
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
);

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
          <OctopusLogo />
          <span className="brand-text">
            <span className="brand-pe">PE</span>
            <span className="brand-platform">Platform</span>
          </span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Dashboard
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

        <div className="navbar-user">
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
