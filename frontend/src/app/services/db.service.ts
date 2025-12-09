import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Player, Match } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly API_BASE_URL = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // Player endpoints
  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.API_BASE_URL}/player/all`);
  }

  createPlayer(player: Omit<Player, 'totalPoints'>): Observable<Player> {
    return this.http.post<Player>(`${this.API_BASE_URL}/player/create`, player);
  }

  updatePlayer(name: string, updates: Partial<Player>): Observable<Player> {
    return this.http.put<Player>(`${this.API_BASE_URL}/player/${name}`, updates);
  }

  deletePlayer(name: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/player/${name}`);
  }

  // Match endpoints
  getMatches(): Observable<Match[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/match/records/`).pipe(
      map(matches => matches.map(match => ({
        id: match.id,
        playerScores: match.playerScores
      })))
    );
  }

  createMatch(match: Match): Observable<Match> {
    return this.http.post<Match>(`${this.API_BASE_URL}/match/create/`, match);
  }

  deleteMatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/match/${id}`);
  }

  // Health check
  checkHealth(): Observable<{ status: string; timestamp: string; database: string }> {
    return this.http.get<{ status: string; timestamp: string; database: string }>(`${this.API_BASE_URL}/health`);
  }
}
