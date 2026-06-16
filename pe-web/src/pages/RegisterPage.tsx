import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import "./AuthPage.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { registerAccount } = useAuth(); // ➔ Inyectamos el servicio
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      // ➔ Solo enviamos el payload que el backend necesita
      const data = await registerAccount({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      login(data.user, data.accessToken);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Error al registrarse");
      } else {
        setError("Error de conexión con el servidor");
      }
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
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">Unite a Liga Pulpito Esports</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Usuario</label>
            <input
              className="input"
              type="text"
              placeholder="tu_nombre"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
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
          <div className="input-group">
            <label className="input-label">Confirmar contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <div className="auth-footer">
          <span>¿Ya tenés cuenta?</span>
          <Link to="/login" className="auth-link">
            Iniciá sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
