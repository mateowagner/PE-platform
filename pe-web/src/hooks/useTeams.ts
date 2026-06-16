import { apiClient } from "../config/apiClient";
import type { Team } from "../types";

export function useTeams() {
  const getMyTeam = async (): Promise<Team> => {
    // Axios lanza un error 404 automáticamente si el usuario no tiene equipo
    const res = await apiClient.get<Team>("/teams/my-team");
    return res.data;
  };

  const leaveTeam = async (): Promise<void> => {
    await apiClient.post("/teams/leave");
  };

  const createTeam = async (formData: FormData): Promise<Team> => {
    const res = await apiClient.post<Team>("/teams", { formData });
    return res.data;
  };
  const kickMember = async (
    teamId: string,
    memberId: string,
  ): Promise<Team> => {
    const res = await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
    return res.data;
  };

  return { getMyTeam, leaveTeam, createTeam, kickMember };
}
