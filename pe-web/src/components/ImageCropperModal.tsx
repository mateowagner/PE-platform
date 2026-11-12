// pe-web/src/components/ImageCropperModal.tsx
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "../utils/cropImage";
import { getCroppedImg } from "../utils/cropImage";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";
import "./ImageCropperModal.css";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(croppedFile);
      onCropComplete(croppedFile, previewUrl);
    } catch (err) {
      console.error("Error al recortar imagen:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="cropper-modal-container fade-in">
        <div className="cropper-header">
          <h3>Ajustar Escudo del Equipo</h3>
          <button
            type="button"
            className="btn-close-cropper"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="cropper-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Molde 1:1 cuadrado perfecto
            cropShape="rect" // Puedes usar "round" si prefieres guía circular
            showGrid={true}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controles de Zoom estilo Steam */}
        <div className="cropper-controls">
          <div className="zoom-slider-row">
            <ZoomOut size={16} color="#9ca3af" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="zoom-range-input"
            />
            <ZoomIn size={16} color="#9ca3af" />
          </div>
        </div>

        <div className="cropper-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={processing}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyCrop}
            disabled={processing}
          >
            <Check size={16} />{" "}
            {processing ? "Procesando..." : "Aplicar Recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
