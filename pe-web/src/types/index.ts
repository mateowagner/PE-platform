export type TournamentStatus = "PREPARING" | "STARTED" | "FINISHED";
export type TournamentType = "LEAGUE" | "CUP" | "GROUPS";
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
  skill_tier: string;
  registration_start_date: string;
  registration_end_date: string;
  start_date: string;
  end_date?: string;
  max_teams: number;
  entry_fee: number | string;
  prize_pool?: string;
  current_stage: string;
  teams: Team[];
  created_at: string;
}
export interface TournamentDetails extends Tournament {
  currentTeamsCount: number;
  teams: (Team & {
    memberCount?: number;
    avgTier?: string;
  })[];
}
export interface TournamentSeries {
  id: string;
  stage_name: string;
  round_order: number;
  status: string;
  team_a_wins: number;
  team_b_wins: number;
  wins_required: number;
  team_a?: { id: string; name: string } | null;
  team_b?: { id: string; name: string } | null;
  winner?: { id: string; name: string } | null;
}
export interface Invitation {
  id: string;
  teamId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  // ➔ Crucial para la UI: El backend debería incluir los datos básicos del equipo que invita
  team?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}
