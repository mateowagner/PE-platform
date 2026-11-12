// pe-web/src/utils/tierValidator.ts

const TIER_HIERARCHY: Record<string, number> = {
  UNRANKED: 0,
  IRON: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  PLATINUM: 5,
  EMERALD: 6,
  DIAMOND: 7,
  MASTER: 8,
  GRANDMASTER: 9,
  CHALLENGER: 10,
};

export interface TierValidationResult {
  allowed: boolean;
  reason?: string;
}

export function validatePlayerTier(
  playerTier: string | undefined | null,
  tournamentTier: string,
  hasRiotAccount: boolean,
): TierValidationResult {
  if (!hasRiotAccount) {
    return { allowed: false, reason: "Sin Riot ID vinculado" };
  }

  const rawTier = (playerTier || "UNRANKED").toUpperCase();
  const playerRankScore = TIER_HIERARCHY[rawTier] ?? 0;

  if (tournamentTier === "OPEN") {
    return { allowed: true };
  }

  if (tournamentTier === "LOW" || tournamentTier === "DIV_4") {
    if (playerRankScore > 3) {
      return { allowed: false, reason: "Excede límite (Máx Plata)" };
    }
  }

  if (tournamentTier === "MID" || tournamentTier === "DIV_3") {
    if (playerRankScore > 5) {
      return { allowed: false, reason: "Excede límite (Máx Platino)" };
    }
  }

  if (tournamentTier === "MID_HIGH" || tournamentTier === "DIV_2") {
    if (playerRankScore > 7) {
      return { allowed: false, reason: "Excede límite (Máx Diamante)" };
    }
  }

  return { allowed: true };
}
