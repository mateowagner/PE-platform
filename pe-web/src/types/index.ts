// pe-web/src/types/index.ts

export type TournamentStatus = "PREPARING" | "STARTED" | "FINISHED";
export type TournamentType = "LEAGUE" | "CUP" | "GROUPS";
export type SkillTier =
  | "OPEN"
  | "HIGH_TIER"
  | "MID_HIGH"
  | "MID"
  | "LOW"
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

export type SeriesFormat = "BO1" | "BO3" | "BO5";
export type ScheduleType = "SAME_DAY" | "WEEKEND" | "CUSTOM";

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

export interface TournamentParticipant extends Team {
  memberCount?: number;
  avgTier?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  type: TournamentType;
  status: TournamentStatus;
  skill_tier: string;
  default_series_format?: SeriesFormat;
  final_series_format?: SeriesFormat;
  schedule_type?: ScheduleType;
  days_between_rounds?: number;
  hours_between_rounds?: number;
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
  teams: TournamentParticipant[];
}

export type UpdateTournamentInput = Partial<
  Omit<Tournament, "id" | "created_at" | "teams">
>;

export interface CreateTournamentInput {
  name: string;
  type: TournamentType;
  skill_tier: string;
  default_series_format?: SeriesFormat;
  final_series_format?: SeriesFormat;
  schedule_type?: ScheduleType;
  days_between_rounds?: number;
  hours_between_rounds?: number;
  max_teams: number;
  entry_fee: number;
  registration_start_date: string;
  registration_end_date: string;
  start_date: string;
}

// ─── SERIES Y PARTIDOS CON FECHAS Y FORMATOS DINÁMICOS ────────────────────────
export interface Match {
  id: string;
  match_order: number;
  status: "CREATED" | "IN_PROGRESS" | "FINISHED";
  tournament_code?: string;
  riot_match_id?: string;
  winner?: { id: string; name: string; logoUrl?: string | null } | null;
  series?: TournamentSeries;
}

export interface TournamentSeries {
  id: string;
  stage_name: string;
  round_order: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  team_a_wins: number;
  team_b_wins: number;
  wins_required: number;
  scheduled_date?: string | null;
  tournament?: {
    id: string;
    name: string;
  } | null;
  next_series_slot?: "TEAM_A" | "TEAM_B" | null;
  next_series?: TournamentSeries | null;
  parent_series_id?: string | null;
  team_a?: { id: string; name: string; logoUrl?: string | null } | null;
  team_b?: { id: string; name: string; logoUrl?: string | null } | null;
  winner?: { id: string; name: string; logoUrl?: string | null } | null;
  matches?: Match[];
}

export interface Invitation {
  id: string;
  teamId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  team: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}
