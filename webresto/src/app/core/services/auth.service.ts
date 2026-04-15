/**
 * ================================================================
 * AuthService — Jalon II (remplace la version mock du Jalon I)
 * ================================================================
 * Tous les appels HTTP vont vers auth-service (port 8081).
 * Le JWT est stocké dans localStorage pour persister au refresh.
 * ================================================================
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User, Role } from '../models';
import {environment} from "../../../environments/environment";
import {JWT_KEY} from "../interceptors/jwt.interceptors";

interface AuthResponse {
  token: string; id: number; nom: string; prenom: string;
  email: string; role: string; telephone: string; adresse: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly BASE = environment.authUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this._restoreSession();
  }

  get currentUser(): User | null { return this.currentUserSubject.value; }
  isLoggedIn(): boolean          { return !!this.currentUserSubject.value; }
  hasRole(roles: Role[]): boolean {
    const u = this.currentUser;
    return !!u && roles.includes(u.role);
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.BASE}/login`, { email, password }).pipe(
        tap(r  => this._save(r)),
        map(r  => this._toUser(r)),
        catchError(this._err)
    );
  }

  register(data: { nom: string; prenom: string; email: string; password: string;
    telephone: string; adresse: string; role: Role }): Observable<User> {
    return this.http.post<AuthResponse>(`${this.BASE}/register`, data).pipe(
        tap(r  => this._save(r)),
        map(r  => this._toUser(r)),
        catchError(this._err)
    );
  }

  logout(): void {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem('webresto_user');
    this.currentUserSubject.next(null);
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem('webresto_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /** Étape 1 reset : envoie un email avec un lien de reset */
  demanderReinitialisationMdp(email: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/forgot-password`, { email }).pipe(catchError(this._err));
  }

  /** Étape 2 reset : nouveau mot de passe + token reçu par email */
  reinitialiserMdp(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/reset-password`, { token, newPassword }).pipe(catchError(this._err));
  }

  updateProfile(data: { nom?: string; prenom?: string; telephone?: string; adresse?: string }): Observable<User> {
    return this.http.put<AuthResponse>(`${this.BASE}/profile`, data).pipe(
        tap(r  => this._save(r)),
        map(r  => this._toUser(r)),
        catchError(this._err)
    );
  }

  private _save(res: AuthResponse): void {
    if (res.token) localStorage.setItem(JWT_KEY, res.token);
    const u = this._toUser(res);
    localStorage.setItem('webresto_user', JSON.stringify(u));
    this.currentUserSubject.next(u);
  }

  private _toUser(res: AuthResponse): User {
    return { id: res.id, nom: res.nom, prenom: res.prenom, email: res.email,
      role: res.role as Role, adresse: res.adresse, telephone: res.telephone };
  }

  private _restoreSession(): void {
    try {
      const u = localStorage.getItem('webresto_user');
      const t = localStorage.getItem(JWT_KEY);
      if (u && t) this.currentUserSubject.next(JSON.parse(u));
    } catch { this.logout(); }
  }

  private _err(err: HttpErrorResponse): Observable<never> {
    let msg = 'Une erreur est survenue';
    if (err.status === 0)       msg = 'Impossible de contacter le serveur. Le backend est-il démarré ?';
    else if (err.error?.error)  msg = err.error.error;
    else if (err.error?.message) msg = err.error.message;
    return throwError(() => new Error(msg));
  }
}
