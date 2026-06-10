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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas");
        return;
      }
      login(data.user, data.accessToken);
      navigate("/dashboard");
    } catch {
      setError("Error de conexión con el servidor");
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
          <img src="/logo.jpeg" alt="Pulpito Esports" className="auth-logo" />
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">Accedé a tu cuenta de Pulpito Esports</p>
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
            style={{ marginTop: "0.5rem", padding: "0.8rem" }}
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
