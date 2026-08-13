import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import "./AuthPage.css";
import { EyeIcon, EyeOffIcon } from "../components/icons/AuthIcons";
export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { loginAccount } = useAuth(); // ➔ Inyectamos nuestro servicio limpio
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ➔ Único punto de contacto con la red
      const data = await loginAccount(form);

      login(data.user, data.accessToken);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Credenciales incorrectas");
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
            <div className="input-password-wrapper">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
