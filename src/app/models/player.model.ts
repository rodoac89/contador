export interface Player {
  id: string;
  name: string;
  totalPoints: number;
}

export interface Match {
  id: string;
  playerScores: { [playerId: string]: MatchScore };
}

export interface MatchScore {
  kills: number;
  placement: 'winner' | 'second' | 'none';
}

export interface User {
  username: string;
  role: 'admin' | 'guest';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
