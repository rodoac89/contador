import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>PUBG Contador de Puntos</mat-card-title>
          <mat-card-subtitle>Selecciona tu modo de acceso</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="login-options">
            <button 
              mat-raised-button 
              color="primary" 
              class="login-button"
              (click)="loginAsGuest()">
              <mat-icon>visibility</mat-icon>
              Entrar como Invitado
            </button>
            
            <div class="admin-login">
              <h3>Acceso de Administrador</h3>
              <mat-form-field appearance="outline">
                <mat-label>Usuario</mat-label>
                <input matInput [(ngModel)]="username" placeholder="admin">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Contraseña</mat-label>
                <input matInput type="password" [(ngModel)]="password" (keyup.enter)="loginAsAdmin()">
              </mat-form-field>
              
              @if (loginError) {
                <div class="error-message">
                  Credenciales incorrectas
                </div>
              }
              
              <button 
                mat-raised-button 
                color="accent" 
                class="login-button"
                (click)="loginAsAdmin()">
                <mat-icon>admin_panel_settings</mat-icon>
                Entrar como Admin
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }
    
    .login-options {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    
    .login-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }
    
    .admin-login {
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    
    .admin-login h3 {
      margin: 0 0 20px 0;
      text-align: center;
      color: #666;
    }
    
    .admin-login mat-form-field {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 15px;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  
  username = '';
  password = '';
  loginError = false;

  loginAsGuest(): void {
    this.authService.loginAsGuest();
  }

  loginAsAdmin(): void {
    if (this.authService.login(this.username, this.password)) {
      this.loginError = false;
    } else {
      this.loginError = true;
    }
  }
}