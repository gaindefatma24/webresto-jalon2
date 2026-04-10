/**
 * ================================================================
 * StorageService — Couche de données en mémoire (Jalon I)
 * ================================================================
 *
 * PRINCIPE : lecture seule depuis les JSON, tout en RAM.
 *
 *   1. init() charge les 5 fichiers JSON en parallèle via HTTP
 *   2. Les données sont conservées dans des Map<clé, tableau>
 *   3. Toutes les opérations CRUD modifient ces tableaux en RAM
 *   4. AUCUNE écriture dans localStorage ou sessionStorage
 *   5. Un rechargement de page repart du JSON original
 *      → comportement identique à ce que fera Jalon II avec
 *        les vrais appels HTTP vers Spring Boot
 *
 * Au Jalon II : on remplace init() + les méthodes par des appels
 * HTTP REST vers les microservices, les signatures restent identiques.
 * ================================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { User, Restaurant, Plat, Categorie, Commande } from '../models';
import { environment } from '../../../environments/environment';

/** Clés des collections en mémoire */
export const STORAGE_KEYS = {
  USERS:        'users',
  RESTAURANTS:  'restaurants',
  PLATS:        'plats',
  CATEGORIES:   'categories',
  COMMANDES:    'commandes',
  CURRENT_USER: 'current_user'   // conservé pour compatibilité des imports existants
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {

  /** Stockage en mémoire : clé → tableau d'objets */
  private store = new Map<string, any[]>();

  /** Compteur auto-incrémenté pour les nouveaux IDs */
  private nextId = Date.now();

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────────────
  // INITIALISATION — chargement unique des JSON
  // ──────────────────────────────────────────────────────────────

  /**
   * Charge tous les fichiers JSON mock en parallèle via HTTP.
   * Appelé UNE SEULE FOIS au démarrage dans AppComponent.ngOnInit().
   * Si déjà initialisé (rechargement app sans refresh), retourne of(true).
   */
  init(): Observable<boolean> {
    if (this.store.size > 0) {
      return of(true); // Déjà chargé (ne devrait pas arriver en SPA normale)
    }

    return forkJoin({
      users:       this.http.get<User[]>      (`${environment.apiUrl}/users.json`),
      restaurants: this.http.get<Restaurant[]>(`${environment.apiUrl}/restaurants.json`),
      plats:       this.http.get<Plat[]>      (`${environment.apiUrl}/plats.json`),
      categories:  this.http.get<Categorie[]> (`${environment.apiUrl}/categories.json`),
      commandes:   this.http.get<Commande[]>  (`${environment.apiUrl}/commandes.json`),
    }).pipe(
      tap(data => {
        this.store.set(STORAGE_KEYS.USERS,       data.users);
        this.store.set(STORAGE_KEYS.RESTAURANTS, data.restaurants);
        this.store.set(STORAGE_KEYS.PLATS,       data.plats);
        this.store.set(STORAGE_KEYS.CATEGORIES,  data.categories);
        this.store.set(STORAGE_KEYS.COMMANDES,   data.commandes);
        console.log('[WebResto] Données JSON chargées en mémoire');
      }),
      map(() => true)
    );
  }

  // ──────────────────────────────────────────────────────────────
  // MÉTHODES GÉNÉRIQUES — même API qu'avant, zéro localStorage
  // ──────────────────────────────────────────────────────────────

  /** Retourne une copie du tableau d'une collection */
  getAll<T>(key: string): T[] {
    return [...(this.store.get(key) ?? [])];
  }

  /** Remplace entièrement une collection en mémoire */
  saveAll<T>(key: string, data: T[]): void {
    this.store.set(key, [...data]);
  }

  /** Trouve un objet par son ID */
  getById<T extends { id: number }>(key: string, id: number): T | undefined {
    return (this.store.get(key) ?? []).find((item: T) => item.id === id);
  }

  /**
   * Ajoute un nouvel objet avec un ID auto-généré.
   * @returns L'objet créé avec son ID
   */
  create<T extends { id: number }>(key: string, item: Omit<T, 'id'>): T {
    const collection = this.store.get(key) ?? [];
    const newItem = { ...item, id: ++this.nextId } as T;
    this.store.set(key, [...collection, newItem]);
    return newItem;
  }

  /**
   * Met à jour un objet existant (merge partiel).
   * @returns L'objet mis à jour, ou null si introuvable
   */
  update<T extends { id: number }>(key: string, id: number, changes: Partial<T>): T | null {
    const collection: T[] = this.store.get(key) ?? [];
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;
    collection[index] = { ...collection[index], ...changes };
    this.store.set(key, [...collection]);
    return collection[index];
  }

  /**
   * Supprime un objet par son ID.
   * @returns true si supprimé, false si introuvable
   */
  delete<T extends { id: number }>(key: string, id: number): boolean {
    const collection: T[] = this.store.get(key) ?? [];
    const filtered = collection.filter(item => item.id !== id);
    if (filtered.length === collection.length) return false;
    this.store.set(key, filtered);
    return true;
  }
}
