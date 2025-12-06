import { Injectable, signal } from '@angular/core';
import { AuthState, User } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSignal = signal<AuthState>({
    isAuthenticated: false,
    user: null
  });

  get authState() {
    return this.authStateSignal;
  }

  get isAdmin(): boolean {
    return this.authStateSignal().user?.role === 'admin';
  }

  get isAuthenticated(): boolean {
    return this.authStateSignal().isAuthenticated;
  }

  login(username: string, password: string): boolean {
    // Simple authentication - in production use proper authentication
    if (username === 'admin' && password === this.getStoredPassword()) {
      const user: User = { username: 'admin', role: 'admin' };
      this.authStateSignal.set({
        isAuthenticated: true,
        user
      });
      localStorage.setItem('auth', JSON.stringify({ user }));
      localStorage.removeItem('hasLoggedOut'); // Limpiar estado de logout
      return true;
    }
    return false;
  }

  loginAsGuest(): void {
    const user: User = { username: 'invitado', role: 'guest' };
    this.authStateSignal.set({
      isAuthenticated: true,
      user
    });
    localStorage.setItem('auth', JSON.stringify({ user }));
    localStorage.removeItem('hasLoggedOut'); // Limpiar estado de logout
  }

  logout(): void {
    this.authStateSignal.set({
      isAuthenticated: false,
      user: null
    });
    localStorage.removeItem('auth');
    localStorage.setItem('hasLoggedOut', 'true');
  }

  changePassword(newPassword: string): void {
    localStorage.setItem('adminPassword', newPassword);
  }

  private getStoredPassword(): string {
    return localStorage.getItem('adminPassword') || 'admin123';
  }

  checkAuthState(): void {
    const stored = localStorage.getItem('auth');
    
    if (stored) {
      try {
        const authData = JSON.parse(stored);
        if (authData.user) {
          this.authStateSignal.set({
            isAuthenticated: true,
            user: authData.user
          });
        }
      } catch (error) {
        localStorage.removeItem('auth');
      }
    }
    // Removido el auto-login automático
  }
}