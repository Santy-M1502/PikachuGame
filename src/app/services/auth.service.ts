import { Injectable, signal } from '@angular/core';
import { supabase } from '../../supabase.config';
import { BehaviorSubject } from 'rxjs';

export interface UserData {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private _isLoggedIn = signal<boolean>(false);
  readonly isLoggedIn = this._isLoggedIn;

  constructor() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      const userId = localStorage.getItem('user_id');

      console.log('AuthService constructor - token:', token, 'userData:', userData);

      this._isLoggedIn.set(!!token);

      if (userData) {
        const user = JSON.parse(userData);
        console.log('AuthService constructor - parsed userData:', user);
        this.currentUserSubject.next(user);
      } else if (token && userId) {
        this.getUser(userId)
          .then(user => console.log('Loaded user from Supabase:', user))
          .catch(err => console.error('Error loading user:', err));
      }
    }
  }

  login(token: string, user: UserData) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('userData', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this._isLoggedIn.set(true);

      console.log('login - token stored, user emitted:', user);
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('userData');
      this.currentUserSubject.next(null);
      this._isLoggedIn.set(false);

      console.log('logout - cleared localStorage and emitted null');
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

  async getUser(id: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    console.log('getUser result:', { data, error });

    if (error) throw error;

    localStorage.setItem('userData', JSON.stringify(data));
    this.currentUserSubject.next(data);

    return data;
  }

  getUserId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  }

  getUserData(): UserData | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.rol === 'admin';
  }
}
