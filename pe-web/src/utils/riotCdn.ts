// pe-web/src/utils/riotCdn.ts

const DDRAGON_VERSION = "14.24.1";

const CHAMPION_NAME_MAP: Record<string, string> = {
  FiddleSticks: "Fiddlesticks",
  fiddlesticks: "Fiddlesticks",
  MonkeyKing: "MonkeyKing",
  Wukong: "MonkeyKing",
  LeBlanc: "Leblanc",
  ChoGath: "Chogath",
  KaiSa: "Kaisa",
  KhaZix: "Khazix",
  VelKoz: "Velkoz",
};

// Ítems especiales, misiones o componentes que Riot registra con IDs internos
const SPECIAL_ITEM_MAP: Record<number, string> = {
  // 2524: Bandlepipes
  2524: "https://raw.communitydragon.org/16.5/game/assets/items/icons2d/autoatlas/xlborderedicons/bandlepipes.png",
};

export function getChampionIconUrl(
  rawChampionName: string | undefined,
): string {
  if (!rawChampionName) return "/default-shield.svg";
  const mapped = CHAMPION_NAME_MAP[rawChampionName] || rawChampionName;
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${mapped}.png`;
}

export function getItemIconUrl(itemId: number): string {
  if (!itemId || itemId === 0) return "";

  // 1. Si está en la lista de ítems especiales/anómalos
  if (SPECIAL_ITEM_MAP[itemId]) {
    return SPECIAL_ITEM_MAP[itemId];
  }

  // 2. Ruta estándar de Data Dragon
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`;
}

/**
 * Fallback universal al árbol completo de assets de CommunityDragon
 */
export function getItemFallbackUrl(itemId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/${itemId}.png`;
}
