import "./PlaceholderPage.css";

export default function TeamPage() {
  return (
    <div className="page-container">
      <h1
        className="section-title"
        style={{ fontSize: "1.6rem", marginBottom: "2rem" }}
      >
        Mi Equipo
      </h1>
      <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Próximamente: gestión de roster, invitaciones y estadísticas del
          equipo.
        </p>
        <button className="btn btn-primary">Crear equipo</button>
      </div>
    </div>
  );
}
