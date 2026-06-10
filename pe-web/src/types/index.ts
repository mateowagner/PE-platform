export type TournamentStatus =
  | "REGISTRATION"
  | "ONGOING"
  | "FINISHED"
  | "PENDING";
export type TournamentType = "ROUND_ROBIN" | "ELIMINATION" | "GROUPS";
export type SkillTier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER";

export interface Member {
  id: string;
  username: string;
  riotGameName: string;
  riotTagLine: string;
  soloTier: string;
  soloRank: string;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  totalRankPoints: number;
  owner: { id: string; username: string };
  members: Member[];
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  type: TournamentType;
  status: TournamentStatus;
  skill_tier: SkillTier;
  registration_start_date: string; // Recibimos ISO strings desde el back
  registration_end_date: string;
  start_date: string;
  end_date?: string;
  max_teams: number;
  entry_fee: number;
  prize_pool?: string;
  current_stage: string;
  teams: Team[];
  winner?: Team;
  created_at: string;
}
