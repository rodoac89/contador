import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-change-credentials',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Cambiar Credenciales</h2>
    
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nueva Contraseña</mat-label>
        <input matInput type="password" [(ngModel)]="newPassword" placeholder="Nueva contraseña">
      </mat-form-field>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Confirmar Contraseña</mat-label>
        <input matInput type="password" [(ngModel)]="confirmPassword" placeholder="Confirmar contraseña" (keyup.enter)="save()">
      </mat-form-field>
      
      @if (errorMessage) {
        <div class="error-message">{{ errorMessage }}</div>
      }
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!canSave()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 15px;
    }
    
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class ChangeCredentialsDialogComponent {
  private dialogRef = inject(MatDialogRef<ChangeCredentialsDialogComponent>);
  private authService = inject(AuthService);
  
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';

  canSave(): boolean {
    return this.newPassword.length >= 6 && this.newPassword === this.confirmPassword;
  }

  save(): void {
    if (!this.canSave()) {
      this.errorMessage = 'Las contraseñas deben coincidir y tener al menos 6 caracteres';
      return;
    }

    this.authService.changePassword(this.newPassword);
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}