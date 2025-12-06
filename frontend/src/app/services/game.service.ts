import { Injectable, signal, computed } from '@angular/core';
import { Player, Match, MatchScore } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly STORAGE_KEY = 'pubg-contador-data';
  
  private players = signal<Player[]>([]);
  private matches = signal<Match[]>([]);

  constructor() {
    this.loadState();
  }

  get playersSignal() {
    return this.players.asReadonly();
  }

  get matchesSignal() {
    return this.matches.asReadonly();
  }

  get playersWithScores() {
    return computed(() => {
      const currentPlayers = this.players();
      const currentMatches = this.matches();
      
      return currentPlayers.map(player => ({
        ...player,
        totalPoints: this.calculatePlayerPoints(player.id, currentMatches)
      }));
    });
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.players.set(data.players || []);
        this.matches.set(data.matches || []);
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      this.players.set([]);
      this.matches.set([]);
    }
  }

  private saveState(): void {
    try {
      const data = {
        players: this.players(),
        matches: this.matches()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  addPlayer(name: string): void {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      totalPoints: 0
    };

    this.players.update(players => [...players, newPlayer]);
    
    // Agregar puntuaciones vacías para el nuevo jugador en todas las partidas existentes
    this.matches.update(matches => 
      matches.map(match => ({
        ...match,
        playerScores: {
          ...match.playerScores,
          [newPlayer.id]: { kills: 0, placement: 'none' }
        }
      }))
    );

    this.saveState();
  }

  addMatch(): void {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      playerScores: {}
    };

    // Inicializar puntuaciones para todos los jugadores
    const currentPlayers = this.players();
    currentPlayers.forEach(player => {
      newMatch.playerScores[player.id] = { kills: 0, placement: 'none' };
    });

    this.matches.update(matches => [...matches, newMatch]);
    this.saveState();
  }

  updateMatchScore(matchId: string, playerId: string, score: MatchScore): void {
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
    this.saveState();
  }

  deletePlayer(playerId: string): void {
    this.players.update(players => players.filter(p => p.id !== playerId));
    this.matches.update(matches => 
      matches.map(match => ({
        ...match,
        playerScores: Object.fromEntries(
          Object.entries(match.playerScores).filter(([id]) => id !== playerId)
        )
      }))
    );
    this.saveState();
  }

  deleteMatch(matchId: string): void {
    this.matches.update(matches => matches.filter(m => m.id !== matchId));
    this.saveState();
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
}