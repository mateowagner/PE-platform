// pe-web/src/components/CreateTeamModal.tsx
import { useState } from "react";
import { useTeams } from "../hooks/useTeams";
import axios from "axios";
import type { Team } from "../types";
import { UploadCloud } from "lucide-react";
import ImageCropperModal from "./ImageCropperModal";

export default function CreateTeamModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (team: Team) => void;
}) {
  const { createTeam } = useTeams();
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados del Recorte
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Solo se admiten formatos PNG o JPEG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen original supera los 5 MB.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result?.toString() || null);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Resetear valor del input para permitir re-seleccionar la misma imagen si se cancela
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    setLogoFile(croppedFile);
    setLogoPreview(previewUrl);
    setShowCropper(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      const newTeam = await createTeam(formData);
      onCreated(newTeam);
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          Array.isArray(err.response?.data?.message)
            ? err.response?.data?.message.join(", ")
            : err.response?.data?.message || "Error al fundar la escuadra.",
        );
      } else {
        setError("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop-overlay" onClick={onClose}>
        <div
          className="modal-dialog-box"
          style={{ maxWidth: "460px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Fundar Escuadra</h2>
              <p className="modal-subtitle">
                Crea tu equipo competitivo oficial para torneos y ligas.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="input-group">
              <label className="input-label">Nombre del Equipo</label>
              <input
                className="input"
                placeholder="Ej: Nexus Gaming"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={3}
                maxLength={25}
                required
              />
            </div>

            <div className="input-group" style={{ marginTop: "1.25rem" }}>
              <label className="input-label">
                Escudo del Club (PNG o JPEG)
              </label>
              <input
                type="file"
                id="team-logo-upload"
                accept="image/png, image/jpeg"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <label
                htmlFor="team-logo-upload"
                style={{
                  border: "2px dashed #2a2d40",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  background: "rgba(22, 24, 36, 0.4)",
                  transition: "border-color 0.2s",
                }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Vista previa"
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "2px solid #9333ea",
                    }}
                  />
                ) : (
                  <>
                    <UploadCloud size={32} color="#06b6d4" />
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                      Haz clic para seleccionar y recortar tu imagen
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>
                      Formato 1:1 Cuadrado
                    </span>
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="auth-error" style={{ marginTop: "1rem" }}>
                {error}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || name.trim().length < 3}
              >
                {loading ? "Subiendo y Fundando..." : "Crear Equipo"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCropper && rawImageSrc && (
        <ImageCropperModal
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </>
  );
}
