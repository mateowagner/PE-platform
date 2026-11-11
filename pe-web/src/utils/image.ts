// pe-web/src/utils/image.ts
import type { Team } from "../types";

// Los assets dentro de /public se acceden directamente desde la raíz
export const DEFAULT_TEAM_LOGO = "/default-shield.svg";

export const DEFAULT_SHIELD_ICON = "/default-shield.svg";

export type TeamLogoLike =
  | Team
  | {
      id?: string;
      name?: string;
      logoUrl?: string | null;
      logo_url?: string | null;
      logo?: string | null;
    }
  | null
  | undefined;

export function getImageUrl(
  path: string | null | undefined,
  fallback = DEFAULT_TEAM_LOGO,
): string {
  if (!path || typeof path !== "string" || !path.trim()) {
    return fallback;
  }

  const cleanPath = path.trim().replace(/\\/g, "/");

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const backendBaseUrl = rawApiUrl
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/+$/, "");

  const normalizedPath = cleanPath.startsWith("/")
    ? cleanPath
    : `/${cleanPath}`;

  return `${backendBaseUrl}${normalizedPath}`;
}

export function getTeamLogo(
  team: TeamLogoLike,
  fallback = DEFAULT_TEAM_LOGO,
): string {
  if (!team) return fallback;

  let path: string | null | undefined;

  if ("logo_url" in team) {
    path = team.logo_url;
  } else if ("logoUrl" in team) {
    path = team.logoUrl;
  } else if ("logo" in team) {
    path = team.logo;
  }

  return getImageUrl(path, fallback);
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_TEAM_LOGO,
): void {
  const target = e.currentTarget;
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
