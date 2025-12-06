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
import { GameService } from './services/game.service';
import { AuthService } from './services/auth.service';
import { AddPlayerDialogComponent } from './components/add-player-dialog.component';
import { LoginComponent } from './components/login.component';
import { ChangeCredentialsDialogComponent } from './components/change-credentials-dialog.component';
import { MatchScore } from './models/player.model';

@Component({
  selector: 'app-root',
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
    MatTooltipModule,
    LoginComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private dialog = inject(MatDialog);
  protected gameService = inject(GameService);
  protected authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.checkAuthState();
  }

  get players() {
    return this.gameService.playersWithScores();
  }

  get matches() {
    return this.gameService.matchesSignal();
  }

  get displayedColumns(): string[] {
    const playerColumns = this.players.map(p => p.id);
    const baseColumns = ['matchNumber', ...playerColumns];
    return this.authService.isAdmin ? [...baseColumns, 'actions'] : baseColumns;
  }

  openAddPlayerDialog(): void {
    const dialogRef = this.dialog.open(AddPlayerDialogComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.gameService.addPlayer(result);
      }
    });
  }

  addMatch(): void {
    this.gameService.addMatch();
  }

  deleteMatch(matchId: string): void {
    this.gameService.deleteMatch(matchId);
  }

  updateKills(matchId: string, playerId: string, kills: number): void {
    const match = this.matches.find(m => m.id === matchId);
    if (match) {
      const currentScore = this.getPlayerScore(matchId, playerId);
      this.gameService.updateMatchScore(matchId, playerId, {
        ...currentScore,
        kills: Math.max(0, Number(kills) || 0)
      });
    }
  }

  incrementKills(matchId: string, playerId: string): void {
    const currentScore = this.getPlayerScore(matchId, playerId);
    this.updateKills(matchId, playerId, currentScore.kills + 1);
  }

  decrementKills(matchId: string, playerId: string): void {
    const currentScore = this.getPlayerScore(matchId, playerId);
    this.updateKills(matchId, playerId, currentScore.kills - 1);
  }

  setPlacement(matchId: string, playerId: string, placement: 'winner' | 'second' | 'none'): void {
    const match = this.matches.find(m => m.id === matchId);
    if (match) {
      const currentScore = this.getPlayerScore(matchId, playerId);
      const newPlacement = currentScore.placement === placement ? 'none' : placement;

      this.gameService.updateMatchScore(matchId, playerId, {
        ...currentScore,
        placement: newPlacement
      });
    }
  }

  getWinner(matchId: string): string | undefined {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return undefined;
    return Object.keys(match.playerScores).find(
      playerId => match.playerScores[playerId].placement === 'winner'
    );
  }

  getSecondPlace(matchId: string): string | undefined {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return undefined;
    return Object.keys(match.playerScores).find(
      playerId => match.playerScores[playerId].placement === 'second'
    );
  }

  getPlayerScore(matchId: string, playerId: string): MatchScore {
    const match = this.matches.find(m => m.id === matchId);
    return match?.playerScores[playerId] || { kills: 0, placement: 'none' };
  }

  logout(): void {
    this.authService.logout();
  }

  openChangeCredentialsDialog(): void {
    this.dialog.open(ChangeCredentialsDialogComponent);
  }

  deletePlayer(playerId: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este jugador? Esto eliminará todos sus registros de partidas.')) {
      this.gameService.deletePlayer(playerId);
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
