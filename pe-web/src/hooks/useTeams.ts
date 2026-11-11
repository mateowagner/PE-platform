// pe-web/src/hooks/useTeams.ts
import { apiClient } from "../config/apiClient";
import type { Team } from "../types";

export interface CreateTeamPayload {
  name: string;
  logo_url?: string;
}

export function useTeams() {
  const getMyTeam = async (): Promise<Team> => {
    const res = await apiClient.get<Team>("/teams/my-team");
    return res.data;
  };

  const leaveTeam = async (): Promise<void> => {
    await apiClient.post("/teams/leave");
  };

  const createTeam = async (
    data: FormData | CreateTeamPayload,
  ): Promise<Team> => {
    const res = await apiClient.post<Team>("/teams", data, {
      headers:
        data instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
    return res.data;
  };

  const updateTeam = async (
    teamId: string,
    data: FormData | Partial<CreateTeamPayload>,
  ): Promise<Team> => {
    const res = await apiClient.patch<Team>(`/teams/${teamId}`, data, {
      headers:
        data instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
    return res.data;
  };

  const kickMember = async (
    teamId: string,
    memberId: string,
  ): Promise<Team> => {
    const res = await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
    return res.data;
  };

  return { getMyTeam, leaveTeam, createTeam, updateTeam, kickMember };
}
