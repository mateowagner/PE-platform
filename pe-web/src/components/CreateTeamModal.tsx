import { useState } from "react";
import { useTeams } from "../hooks/useTeams";
import axios from "axios";
import type { Team } from "../types";

export default function CreateTeamModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (team: Team) => void;
}) {
  const { createTeam } = useTeams();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);

    if (uploadMode === "file" && logoFile) {
      formData.append("logo", logoFile);
    } else if (uploadMode === "url" && logoUrl) {
      formData.append("logo_url", logoUrl);
    }

    try {
      const newTeam = await createTeam(formData);
      onCreated(newTeam);
      onClose();
    } catch (err) {
      // Manejo de errores profesional con Axios
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Error al crear el equipo");
      } else {
        setError("Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-modal-overlay" onClick={onClose}>
      <div className="create-team-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Crear equipo</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Nombre del equipo</label>
            <input
              className="input"
              placeholder="Ej: Team Nexus"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={3}
              maxLength={25}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Logo del equipo</label>
            <div className="logo-mode-toggle">
              <button
                type="button"
                className={`btn btn-sm ${uploadMode === "url" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setUploadMode("url")}
              >
                URL
              </button>
              <button
                type="button"
                className={`btn btn-sm ${uploadMode === "file" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setUploadMode("file")}
              >
                Subir archivo
              </button>
            </div>

            {uploadMode === "url" ? (
              <input
                className="input"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            ) : (
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  id="logo-file"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <label htmlFor="logo-file" className="file-upload-label">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="preview"
                      className="logo-preview"
                    />
                  ) : (
                    <span className="file-upload-text">
                      Hacé clic para seleccionar imagen
                    </span>
                  )}
                </label>
              </div>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}
          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear equipo"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
