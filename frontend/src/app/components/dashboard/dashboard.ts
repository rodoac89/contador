import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameService } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';
import { AddPlayerDialogComponent } from '../add-player-dialog.component';
import { LoginComponent } from '../login/login';
import { ChangeCredentialsDialogComponent } from '../change-credentials-dialog.component';
import { MatchScore, Match } from '../../models/player.model';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatToolbarModule,
    MatCardModule,
    FormsModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private dialog = inject(MatDialog);
  protected gameService = inject(GameService);
  protected authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.checkAuthState();
    // Ensure data is loaded when component initializes
    this.gameService.refreshData();
  }

  get players() {
    return this.gameService.playersWithScores();
  }

  get matches() {
    return this.gameService.matchesSignal();
  }

  get loading() {
    return this.gameService.loadingSignal();
  }

  get error() {
    return this.gameService.errorSignal();
  }

  get displayedColumns(): string[] {
    const playerColumns = this.players.map((p: any) => p.id);
    const baseColumns = ['matchNumber', ...playerColumns];
    return this.authService.isAdmin ? [...baseColumns, 'actions'] : baseColumns;
  }

  openLoginModal(): void {
    this.dialog.open(LoginComponent);
  }

  openAddPlayerDialog(): void {
    const dialogRef = this.dialog.open(AddPlayerDialogComponent);
    
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.gameService.addPlayer(result);
      }
    });
  }

  async addMatch(): Promise<void> {
    await this.gameService.addMatch();
  }

  async deleteMatch(matchId: string): Promise<void> {
    await this.gameService.deleteMatch(matchId);
  }

  async updateKills(matchId: string, playerId: string, kills: number): Promise<void> {
    const match = this.matches.find((m: Match) => m.id === matchId);
    if (match) {
      const currentScore = this.getPlayerScore(matchId, playerId);
      await this.gameService.updateMatchScore(matchId, playerId, {
        ...currentScore,
        kills: Math.max(0, Number(kills) || 0)
      });
    }
  }

  async incrementKills(matchId: string, playerId: string): Promise<void> {
    const currentScore = this.getPlayerScore(matchId, playerId);
    await this.updateKills(matchId, playerId, currentScore.kills + 1);
  }

  async decrementKills(matchId: string, playerId: string): Promise<void> {
    const currentScore = this.getPlayerScore(matchId, playerId);
    await this.updateKills(matchId, playerId, currentScore.kills - 1);
  }

  async setPlacement(matchId: string, playerId: string, placement: 'winner' | 'second' | 'none'): Promise<void> {
    const match = this.matches.find((m: Match) => m.id === matchId);
    if (match) {
      const currentScore = this.getPlayerScore(matchId, playerId);
      const newPlacement = currentScore.placement === placement ? 'none' : placement;

      await this.gameService.updateMatchScore(matchId, playerId, {
        ...currentScore,
        placement: newPlacement
      });
    }
  }

  getWinner(matchId: string): string | undefined {
    const match = this.matches.find((m: Match) => m.id === matchId);
    if (!match) return undefined;
    return Object.keys(match.playerScores).find(
      playerId => match.playerScores[playerId].placement === 'winner'
    );
  }

  getSecondPlace(matchId: string): string | undefined {
    const match = this.matches.find((m: Match) => m.id === matchId);
    if (!match) return undefined;
    return Object.keys(match.playerScores).find(
      playerId => match.playerScores[playerId].placement === 'second'
    );
  }

  getPlayerScore(matchId: string, playerId: string): MatchScore {
    const match = this.matches.find((m: Match) => m.id === matchId);
    return match?.playerScores[playerId] || { kills: 0, placement: 'none' };
  }

  logout(): void {
    this.authService.logout();
  }

  openChangeCredentialsDialog(): void {
    this.dialog.open(ChangeCredentialsDialogComponent);
  }

  async deletePlayer(playerId: string): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar este jugador? Esto eliminará todos sus registros de partidas.')) {
      await this.gameService.deletePlayer(playerId);
    }
  }

  calculateMatchPoints(matchId: string, playerId: string): number {
    const score = this.getPlayerScore(matchId, playerId);
    let points = score.kills;
    if (score.placement === 'winner') points += 3;
    else if (score.placement === 'second') points += 1;
    return points;
  }
}
