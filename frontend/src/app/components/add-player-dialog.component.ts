import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-player-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Agregar Jugador</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>Nombre del jugador</mat-label>
        <input matInput [(ngModel)]="playerName" (keyup.enter)="onSubmit()" autofocus>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!playerName.trim()">
        Agregar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px 0;
      min-width: 300px;
    }
  `]
})
export class AddPlayerDialogComponent {
  playerName = '';
  private dialogRef = inject(MatDialogRef<AddPlayerDialogComponent>);

  onSubmit(): void {
    if (this.playerName.trim()) {
      this.dialogRef.close(this.playerName.trim());
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
