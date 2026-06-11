import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get baseUrl(): string {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('vercel.app')) {
      return `http://${hostname}:8080/api/auth`;
    }
    return 'http://localhost:8080/api/auth';
  }
  
  // Angular signals for reactive state management
  currentUserSignal = signal<User | null>(null);
  
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  token = computed(() => this.currentUserSignal()?.token || null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const saved = localStorage.getItem('glowvera_user');
    if (saved) {
      try {
        const user: User = JSON.parse(saved);
        this.currentUserSignal.set(user);
      } catch (e) {
        localStorage.removeItem('glowvera_user');
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/login`, credentials).pipe(
      tap(user => {
        localStorage.setItem('glowvera_user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  register(userData: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/signup`, userData).pipe(
      tap(user => {
        localStorage.setItem('glowvera_user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('glowvera_user');
    this.currentUserSignal.set(null);
  }
}
