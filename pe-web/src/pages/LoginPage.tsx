import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "./AuthPage.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/v1/users", {
        method: "GET",
        //headers: { "Content-Type": "application/json" },
        //credentials: "include",
        //body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas");
        return;
      }

      login(data.user, data.accessToken);
      navigate("/dashboard");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-glow" />
        <div className="bg-grid" />
      </div>

      <div className="auth-card fade-in">
        <div className="auth-card-header">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="13" r="7" fill="url(#al)" />
              <circle cx="13.5" cy="11.5" r="1.2" fill="white" opacity="0.9" />
              <circle cx="18.5" cy="11.5" r="1.2" fill="white" opacity="0.9" />
              <path
                d="M9 19 Q7 22 8 25 Q9 27 10 25 Q11 23 10 21"
                stroke="url(#al)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M12 20.5 Q11 24 12 27 Q13 29 14 27 Q14.5 25 13.5 22.5"
                stroke="url(#al)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M16 21 Q16 25 16.5 28 Q17 30 18 28 Q18.5 26 17.5 23"
                stroke="url(#al)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M19.5 20.5 Q21 24 20.5 27 Q20 29 19 27 Q18.5 25 19 22.5"
                stroke="url(#al)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M23 19 Q25 22 24 25 Q23 27 22 25 Q21 23 22 21"
                stroke="url(#al)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="al"
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
          </div>
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">Accedé a tu cuenta de PE Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="auth-footer">
          <span>¿No tenés cuenta?</span>
          <Link to="/register" className="auth-link">
            Registrate
          </Link>
        </div>
      </div>
    </div>
  );
}
