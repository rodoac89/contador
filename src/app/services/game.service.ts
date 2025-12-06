import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Player, Match, MatchScore } from '../models/player.model';

interface DbPlayer {
  id: string;
  name: string;
}

interface DbMatch {
  id: string;
}

interface DbMatchScore {
  match_id: string;
  player_id: string;
  kills: number;
  placement: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private apiUrl = '/api';
  
  private players = signal<Player[]>([]);
  private matches = signal<Match[]>([]);

  readonly playersSignal = this.players.asReadonly();
  readonly matchesSignal = this.matches.asReadonly();

  readonly playersWithScores = computed(() => {
    const players = this.players();
    const matches = this.matches();
    
    return players.map(player => ({
      ...player,
      totalPoints: this.calculatePlayerPoints(player.id, matches)
    }));
  });

  constructor() {
    // Cargar estado inicial después de que Angular esté listo
    setTimeout(() => this.loadState(), 0);
  }

  private async loadState(): Promise<void> {
    try {
      const state = await firstValueFrom(
        this.http.get<{ players: DbPlayer[], matches: DbMatch[], scores: DbMatchScore[] }>(`${this.apiUrl}/state`)
      );

      // Convertir datos de la BD al formato de la aplicación
      const matchesMap: { [id: string]: Match } = {};
      
      state.matches.forEach(match => {
        matchesMap[match.id] = {
          id: match.id,
          playerScores: {}
        };
      });

      state.scores.forEach(score => {
        if (matchesMap[score.match_id]) {
          matchesMap[score.match_id].playerScores[score.player_id] = {
            kills: score.kills,
            placement: score.placement as 'winner' | 'second' | 'none'
          };
        }
      });

      this.players.set(state.players.map(p => ({ ...p, totalPoints: 0 })));
      this.matches.set(Object.values(matchesMap));
      console.log('Estado cargado:', { players: state.players.length, matches: state.matches.length });
    } catch (error) {
      console.error('Error loading state:', error);
      // Inicializar con arrays vacíos si hay error
      this.players.set([]);
      this.matches.set([]);
    }
  }

  async addPlayer(name: string): Promise<void> {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      totalPoints: 0
    };

    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/players`, newPlayer));
      this.players.update(players => [...players, newPlayer]);
      
      // Recargar estado para obtener las puntuaciones inicializadas
      await this.loadState();
    } catch (error) {
      console.error('Error adding player:', error);
    }
  }

  async addMatch(): Promise<void> {
    const newMatch: Match = {
      id: Date.now().toString(),
      playerScores: {}
    };
    
    // Initialize scores for all players
    this.players().forEach(player => {
      newMatch.playerScores[player.id] = {
        kills: 0,
        placement: 'none'
      };
    });

    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/matches`, { id: newMatch.id }));
      this.matches.update(matches => [...matches, newMatch]);
      
      // Recargar estado para obtener las puntuaciones inicializadas
      await this.loadState();
    } catch (error) {
      console.error('Error adding match:', error);
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/matches/${matchId}`));
      this.matches.update(matches => matches.filter(m => m.id !== matchId));
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  }

  async updateMatchScore(matchId: string, playerId: string, score: MatchScore): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.apiUrl}/match-scores`, {
          matchId,
          playerId,
          kills: score.kills,
          placement: score.placement
        })
      );

      this.matches.update(matches => 
        matches.map(match => {
          if (match.id === matchId) {
            return {
              ...match,
              playerScores: {
                ...match.playerScores,
                [playerId]: score
              }
            };
          }
          return match;
        })
      );
    } catch (error) {
      console.error('Error updating match score:', error);
    }
  }

  private calculatePlayerPoints(playerId: string, matches: Match[]): number {
    return matches.reduce((total, match) => {
      const score = match.playerScores[playerId];
      if (!score) return total;
      
      let points = score.kills; // 1 punto por kill
      
      if (score.placement === 'winner') {
        points += 3; // 3 puntos por ganar
      } else if (score.placement === 'second') {
        points += 1; // 1 punto por segundo lugar
      }
      
      return total + points;
    }, 0);
  }

  async deletePlayer(playerId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/players/${playerId}`));
      this.players.update(players => players.filter(p => p.id !== playerId));
      this.matches.update(matches => 
        matches.map(match => ({
          ...match,
          playerScores: Object.fromEntries(
            Object.entries(match.playerScores).filter(([id]) => id !== playerId)
          )
        }))
      );
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  }
}
