/**
 * ================================================================
 * AuthService — Authentification (Jalon I)
 * ================================================================
 *
 * La session est gardée uniquement en mémoire (BehaviorSubject).
 * Aucune écriture dans localStorage ou sessionStorage.
 * Un rechargement de page déconnecte l'utilisateur — comportement
 * attendu, identique à ce que fera le JWT au Jalon II.
 *
 * Au Jalon II → les méthodes feront des appels HTTP vers le
 * microservice d'authentification Spring Boot.
 * ================================================================
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, Role } from '../models';
import { StorageService, STORAGE_KEYS } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private storage: StorageService) {}

  // ──────────────────────────────────────────────────────────────
  // GETTERS
  // ──────────────────────────────────────────────────────────────

  get currentUser(): User | null { return this.currentUserSubject.value; }

  isLoggedIn(): boolean { return !!this.currentUserSubject.value; }

  hasRole(roles: Role[]): boolean {
    const user = this.currentUser;
    return !!user && roles.includes(user.role);
  }

  // ──────────────────────────────────────────────────────────────
  // CONNEXION / INSCRIPTION / DÉCONNEXION
  // ──────────────────────────────────────────────────────────────

  /** Connexion avec email et mot de passe */
  login(email: string, password: string): Observable<User> {
    const users = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      return throwError(() => new Error('Email ou mot de passe incorrect')).pipe(delay(400));
    }
    const safeUser = this._stripPassword(user);
    return of(safeUser).pipe(delay(400), tap(u => this.currentUserSubject.next(u)));
  }

  /** Connexion rapide avec les comptes de démonstration */
  quickLogin(role: 'client' | 'restaurateur' | 'livreur'): Observable<User> {
    const emailMap: Record<string, string> = {
      client: 'client@test.com',
      restaurateur: 'resto@test.com',
      livreur: 'livreur@test.com'
    };
    const users = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === emailMap[role]);
    if (!user) return throwError(() => new Error('Compte de test introuvable'));
    const safeUser = this._stripPassword(user);
    return of(safeUser).pipe(delay(300), tap(u => this.currentUserSubject.next(u)));
  }

  /** Inscription d'un nouvel utilisateur */
  register(data: {
    nom: string; prenom: string; email: string;
    password: string; telephone: string; adresse: string; role: Role;
  }): Observable<User> {
    const users = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return throwError(() => new Error('Cet email est déjà utilisé'));
    }
    const newUser = this.storage.create<User>(STORAGE_KEYS.USERS, { ...data });
    const safeUser = this._stripPassword(newUser);
    return of(safeUser).pipe(delay(500), tap(u => this.currentUserSubject.next(u)));
  }

  /** Déconnexion */
  logout(): void {
    this.currentUserSubject.next(null);
  }

  /** Met à jour la session après modification du profil */
  updateCurrentUser(user: User): void {
    this.currentUserSubject.next(this._stripPassword(user));
  }

  // ──────────────────────────────────────────────────────────────
  // RECOUVREMENT DE MOT DE PASSE (Jalon I — simulé en mémoire)
  // ──────────────────────────────────────────────────────────────

  /**
   * Étape 1 — Vérifie que l'email existe et génère un code à 6 chiffres.
   *
   * Jalon I  : le code est retourné directement pour l'afficher à l'écran.
   * Jalon II : POST /auth/mot-de-passe/demande { email }
   *            → le code sera envoyé par email, jamais retourné ici.
   */
  demanderReinitialisationMdp(email: string): Observable<string> {
    const users = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const existe = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (!existe) {
      return throwError(() => new Error('Aucun compte trouvé avec cet email')).pipe(delay(400));
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return of(code).pipe(delay(600));
  }

  /**
   * Étape 2 — Réinitialise le mot de passe en mémoire.
   *
   * Jalon I  : le code n'est pas re-vérifié ici (déjà vérifié dans le composant).
   * Jalon II : POST /auth/mot-de-passe/reinitialiser { email, code, nouveauMotDePasse }
   */
  reinitialiserMdp(email: string, nouveauMotDePasse: string): Observable<void> {
    const users = this.storage.getAll<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (index === -1) {
      return throwError(() => new Error('Utilisateur introuvable')).pipe(delay(400));
    }

    users[index] = { ...users[index], password: nouveauMotDePasse };
    this.storage.saveAll(STORAGE_KEYS.USERS, users);

    return of(void 0).pipe(delay(500));
  }

  // ──────────────────────────────────────────────────────────────
  // MÉTHODE PRIVÉE
  // ──────────────────────────────────────────────────────────────

  /** Supprime le mot de passe avant d'exposer l'objet User */
  private _stripPassword(user: User): User {
    const safe = { ...user };
    delete safe.password;
    return safe;
  }
}
