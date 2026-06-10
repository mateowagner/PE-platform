export function formatDate(isoString: string | undefined): string {
  if (!isoString) return "Fecha a confirmar";

  // Convertimos el texto de la base de datos en un objeto Date de JavaScript
  const date = new Date(isoString);

  // Lo formateamos al estilo argentino (DD/MM/YYYY)
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
