import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      this._isLoggedIn.set(!!token);
    }
  }

  // para usar en plantilla: authService.isLoggedIn()
  readonly isLoggedIn = this._isLoggedIn;

  login(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      this._isLoggedIn.set(true);
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      this._isLoggedIn.set(false);
    }
  }

  isAuthenticated(): boolean {
    return this._isLoggedIn();
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }
}
