import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Player, Match, MatchScore } from '../models/player.model';
import { DatabaseService } from './db.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly databaseService = inject(DatabaseService);
  
  private players = signal<Player[]>([]);
  private matches = signal<Match[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  constructor() {
    this.loadData();
  }

  get playersSignal() {
    return this.players.asReadonly();
  }

  get matchesSignal() {
    return this.matches.asReadonly();
  }

  get loadingSignal() {
    return this.loading.asReadonly();
  }

  get errorSignal() {
    return this.error.asReadonly();
  }

  get playersWithScores() {
    return computed(() => {
      const currentPlayers = this.players();
      
      // En SQLite, totalPoints ya está calculado en el servidor
      return currentPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
    });
  }

  private async loadData(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      console.log('Attempting to connect to database server...');
      
      // Test connection first
      await firstValueFrom(this.databaseService.checkHealth());
      console.log('Database server connection successful');
      
      const [players, matches] = await Promise.all([
        firstValueFrom(this.databaseService.getPlayers()),
        firstValueFrom(this.databaseService.getMatches())
      ]);
      
      this.players.set(players || []);
      this.matches.set(matches || []);
      console.log('Data loaded successfully loadData:', { players: players?.length, matches: matches?.length });
    } catch (error) {
      console.error('Error loading data from database:', error);
      this.error.set('Error loading data from database');
      // Fallback: try to load from localStorage
      this.loadFromLocalStorage();
    } finally {
      this.loading.set(false);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('pubg-contador-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.players.set(data.players || []);
        this.matches.set(data.matches || []);
        console.log('Loaded data from localStorage as fallback');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.players.set([]);
      this.matches.set([]);
    }
  }

  async addPlayer(name: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const newPlayer: Player = {
        name,
        totalPoints: 0
      };

      const createdPlayer = await firstValueFrom(this.databaseService.createPlayer(newPlayer));
      
      if (createdPlayer) {
        this.players.update(players => [...players, createdPlayer]);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      this.error.set('Error adding player to database');
    } finally {
      this.loading.set(false);
    }
  }

  async addMatch(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const newMatch: Match = {
        id: crypto.randomUUID(),
        playerScores: {}
      };

      // Inicializar puntuaciones para todos los jugadores
      const currentPlayers = this.players();
      currentPlayers.forEach(player => {
        newMatch.playerScores[player.name] = { kills: 0, placement: 'none' };
      });

      const createdMatch = await firstValueFrom(this.databaseService.createMatch(newMatch));
      
      if (createdMatch) {
        this.matches.update(matches => [...matches, createdMatch]);
      }
    } catch (error) {
      console.error('Error adding match:', error);
      this.error.set('Error adding match to database');
    } finally {
      this.loading.set(false);
    }
  }

  async updateMatchScore(matchId: string, playerId: string, score: MatchScore): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Actualizar localmente primero para mejor UX
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

      // Obtener la partida completa actualizada
      const currentMatch = this.matches().find(m => m.id === matchId);
      if (currentMatch) {
        // Recrear la partida en la base de datos
        await firstValueFrom(this.databaseService.deleteMatch(matchId));
        const updatedMatch = await firstValueFrom(this.databaseService.createMatch(currentMatch));
        
        if (updatedMatch) {
          // Recargar los jugadores para obtener los puntos actualizados
          const updatedPlayers = await firstValueFrom(this.databaseService.getPlayers());
          this.players.set(updatedPlayers || []);
        }
      }
    } catch (error) {
      console.error('Error updating match score:', error);
      this.error.set('Error updating match score in database');
      // Revert local changes if database update failed
      this.loadData();
    } finally {
      this.loading.set(false);
    }
  }

  async deletePlayer(playerId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      await firstValueFrom(this.databaseService.deletePlayer(playerId));
      
      this.players.update(players => players.filter(p => p.name !== playerId));
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
      this.error.set('Error deleting player from database');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      await firstValueFrom(this.databaseService.deleteMatch(matchId));
      
      this.matches.update(matches => matches.filter(m => m.id !== matchId));
      
      // Recargar los jugadores para obtener los puntos actualizados
      const updatedPlayers = await firstValueFrom(this.databaseService.getPlayers());
      this.players.set(updatedPlayers || []);
    } catch (error) {
      console.error('Error deleting match:', error);
      this.error.set('Error deleting match from database');
    } finally {
      this.loading.set(false);
    }
  }

  async refreshData(): Promise<void> {
    await this.loadData();
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      const health = await firstValueFrom(this.databaseService.checkHealth());
      return health?.status === 'OK';
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }
}