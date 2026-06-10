export interface AuthenticatedRequest {
  user: {
    id: string;
    username: string;
  };
}
