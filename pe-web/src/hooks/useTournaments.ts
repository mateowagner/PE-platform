import { apiClient } from "../config/apiClient";
import type { Tournament, TournamentDetails, TournamentSeries } from "../types";

export function useTournament() {
  // --- METODOS BASE (CRUD) ---
  const createTournament = async (
    data: Partial<Tournament>,
  ): Promise<Tournament> => {
    const res = await apiClient.post<Tournament>("/tournaments", data);
    return res.data;
  };

  const updateTournament = async (
    id: string,
    data: Partial<Tournament>,
  ): Promise<TournamentDetails> => {
    const res = await apiClient.patch<TournamentDetails>(
      `/tournaments/${id}`,
      data,
    );
    return res.data;
  };

  const deleteTournament = async (id: string): Promise<void> => {
    await apiClient.delete(`/tournaments/${id}`);
  };

  // --- METODOS DE DETALLE E INSCRIPCIÓN ---
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
      `/tournaments/${tournamentId}/generate-fixture`,
    );
    return res.data;
  };
  const getTournaments = async (): Promise<Tournament[]> => {
    const res = await apiClient.get<Tournament[]>("/tournaments");
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
  };
}
