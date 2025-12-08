import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player, Match } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private readonly API_BASE_URL = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Player endpoints
  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.API_BASE_URL}/players`);
  }

  createPlayer(player: Omit<Player, 'totalPoints'>): Observable<Player> {
    return this.http.post<Player>(`${this.API_BASE_URL}/players`, player);
  }

  updatePlayer(id: string, updates: Partial<Player>): Observable<Player> {
    return this.http.put<Player>(`${this.API_BASE_URL}/players/${id}`, updates);
  }

  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/players/${id}`);
  }

  // Match endpoints
  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.API_BASE_URL}/matches`);
  }

  createMatch(match: Match): Observable<Match> {
    return this.http.post<Match>(`${this.API_BASE_URL}/matches`, match);
  }

  deleteMatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/matches/${id}`);
  }

  // Health check
  checkHealth(): Observable<{ status: string; timestamp: string; database: string }> {
    return this.http.get<{ status: string; timestamp: string; database: string }>(`${this.API_BASE_URL}/health`);
  }
}