import { useAuthStore } from "../store/authStore";
import "./PlaceholderPage.css";

export default function AccountPage() {
  const { user } = useAuthStore();

  return (
    <div className="page-container">
      <h1
        className="section-title"
        style={{ fontSize: "1.6rem", marginBottom: "2rem" }}
      >
        Mi Cuenta
      </h1>
      <div className="card" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="input-group">
            <label className="input-label">Usuario</label>
            <input className="input" value={user?.username ?? ""} readOnly />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" value={user?.email ?? ""} readOnly />
          </div>
          <div className="input-group">
            <label className="input-label">Riot ID</label>
            <input
              className="input"
              placeholder="nombre#TAG"
              defaultValue={user?.riotGameName ?? ""}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Región</label>
            <input
              className="input"
              placeholder="LAS, LAN, NA1..."
              defaultValue={user?.riotRegion ?? ""}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ alignSelf: "flex-start" }}
          >
            Vincular cuenta Riot
          </button>
        </div>
      </div>
    </div>
  );
}
