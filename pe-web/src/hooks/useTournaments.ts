// pe-web/src/hooks/useTournaments.ts
import { apiClient } from "../config/apiClient";
import type {
  Tournament,
  TournamentDetails,
  TournamentSeries,
  UpdateTournamentInput,
  CreateTournamentInput,
  Match,
} from "../types";

export function useTournaments() {
  const createTournament = async (
    data: CreateTournamentInput,
  ): Promise<Tournament> => {
    const res = await apiClient.post<Tournament>("/tournaments", data);
    return res.data;
  };

  const deleteTournament = async (id: string): Promise<void> => {
    await apiClient.delete(`/tournaments/${id}`);
  };

  const getTournamentDetails = async (
    id: string,
  ): Promise<TournamentDetails> => {
    const res = await apiClient.get<TournamentDetails>(`/tournaments/${id}`);
    return res.data;
  };

  const getTournamentSeries = async (
    id: string,
  ): Promise<TournamentSeries[]> => {
    const res = await apiClient.get<TournamentSeries[]>(
      `/tournaments/${id}/series`,
    );
    return res.data;
  };

  const inscribeTeam = async (
    tournamentId: string,
    teamId: string,
  ): Promise<void> => {
    await apiClient.post(`/tournaments/${tournamentId}/inscribe`, { teamId });
  };

  const cancelInscription = async (
    tournamentId: string,
    teamId: string,
  ): Promise<void> => {
    await apiClient.delete(`/tournaments/${tournamentId}/inscribe/${teamId}`);
  };

  const startTournament = async (
    tournamentId: string,
  ): Promise<TournamentDetails> => {
    const res = await apiClient.post<TournamentDetails>(
      `/tournaments/${tournamentId}/start`,
    );
    return res.data;
  };

  const getTournaments = async (): Promise<Tournament[]> => {
    const res = await apiClient.get<Tournament[]>("/tournaments");
    return res.data;
  };

  const updateTournament = async (
    tournamentId: string,
    data: UpdateTournamentInput,
  ): Promise<TournamentDetails> => {
    const res = await apiClient.patch<TournamentDetails>(
      `/tournaments/${tournamentId}`,
      data,
    );
    return res.data;
  };

  // Endpoint de reprogramación de series
  const rescheduleSeries = async (
    seriesId: string,
    scheduledDateIso: string,
  ): Promise<TournamentSeries> => {
    const res = await apiClient.patch<TournamentSeries>(
      `/series/${seriesId}/reschedule`,
      { scheduled_date: scheduledDateIso },
    );
    return res.data;
  };

  // Endpoint de partidos del equipo
  const getTeamMatches = async (
    teamId: string,
    status?: "pending" | "finished",
  ): Promise<Match[]> => {
    const url = status
      ? `/matches/team/${teamId}?status=${status}`
      : `/matches/team/${teamId}`;
    const res = await apiClient.get<Match[]>(url);
    return res.data;
  };

  return {
    createTournament,
    updateTournament,
    deleteTournament,
    getTournamentDetails,
    getTournamentSeries,
    inscribeTeam,
    cancelInscription,
    startTournament,
    getTournaments,
    rescheduleSeries,
    getTeamMatches,
  };
}
