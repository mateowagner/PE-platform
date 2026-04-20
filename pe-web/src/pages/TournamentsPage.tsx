import "./PlaceholderPage.css";

export default function TournamentsPage() {
  return (
    <div className="page-container">
      <h1
        className="section-title"
        style={{ fontSize: "1.6rem", marginBottom: "2rem" }}
      >
        Torneos
      </h1>
      <div className="placeholder-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card placeholder-card">
            <div className="placeholder-bar w-40" />
            <div className="placeholder-bar w-70" />
            <div className="placeholder-bar w-55" />
          </div>
        ))}
      </div>
    </div>
  );
}
