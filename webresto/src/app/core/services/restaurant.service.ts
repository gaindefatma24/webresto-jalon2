/**
 * ================================================================
 * RestaurantService — Gestion des restaurants et plats (Jalon I)
 * ================================================================
 *
 * Ce service gère toutes les opérations CRUD sur :
 *   - Les restaurants (lister, créer, modifier, supprimer)
 *   - Les plats (lister, créer, modifier, supprimer)
 *   - Les catégories (lecture seule)
 *
 * ================================================================
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Restaurant, Plat, Categorie } from '../models';
import { StorageService, STORAGE_KEYS } from './storage.service';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  constructor(private storage: StorageService) {}

  // ──────────────────────────────────────────────────────────────
  // CATÉGORIES
  // ──────────────────────────────────────────────────────────────

  /** Retourne toutes les catégories (Pizzeria, Sushi, Burger...) */
  getCategories(): Observable<Categorie[]> {
    return of(this.storage.getAll<Categorie>(STORAGE_KEYS.CATEGORIES)).pipe(delay(100));
  }

  // ──────────────────────────────────────────────────────────────
  // RESTAURANTS — LECTURE
  // ──────────────────────────────────────────────────────────────

  /** Retourne tous les restaurants */
  getAll(): Observable<Restaurant[]> {
    return of(this.storage.getAll<Restaurant>(STORAGE_KEYS.RESTAURANTS)).pipe(delay(200));
  }

  /**
   * Retourne un restaurant par son ID.
   * Utilisé par la page de détail (/restaurants/:id)
   */
  getById(id: number): Observable<Restaurant | undefined> {
    return of(this.storage.getById<Restaurant>(STORAGE_KEYS.RESTAURANTS, id)).pipe(delay(100));
  }

  /**
   * Retourne les restaurants d'un restaurateur spécifique.
   * Utilisé dans le dashboard restaurateur.
   * @param proprietaireId - ID de l'utilisateur restaurateur
   */
  getByProprietaire(proprietaireId: number): Observable<Restaurant[]> {
    const all = this.storage.getAll<Restaurant>(STORAGE_KEYS.RESTAURANTS);
    return of(all.filter(r => r.proprietaireId === proprietaireId)).pipe(delay(200));
  }

  /**
   * Recherche et filtre les restaurants.
   * Utilisé dans la page liste avec barre de recherche et filtres.
   * @param query   - Texte de recherche (nom ou description)
   * @param catId   - Filtre par catégorie (null = toutes)
   */
  search(query: string, catId?: number | null): Observable<Restaurant[]> {
    const all = this.storage.getAll<Restaurant>(STORAGE_KEYS.RESTAURANTS);
    const filtered = all.filter(r => {
      const q = query.toLowerCase();
      const matchSearch = !q
        || r.nom.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q);
      const matchCat = !catId || r.categorieId === catId;
      return matchSearch && matchCat;
    });
    return of(filtered).pipe(delay(150));
  }

  // ──────────────────────────────────────────────────────────────
  // RESTAURANTS — ÉCRITURE (CRUD)
  // ──────────────────────────────────────────────────────────────

  /**
   * Crée un nouveau restaurant et le conserve en mémoire.
   * @param data - Données du formulaire (sans ID, sans proprietaireId)
   * @param proprietaireId - ID du restaurateur connecté
   */
  createRestaurant(
    data: Omit<Restaurant, 'id' | 'proprietaireId'>,
    proprietaireId: number
  ): Observable<Restaurant> {
    const newResto = this.storage.create<Restaurant>(
      STORAGE_KEYS.RESTAURANTS,
      { ...data, proprietaireId }
    );
    return of(newResto).pipe(delay(400));
  }

  /**
   * Modifie un restaurant existant.
   * @param id      - ID du restaurant à modifier
   * @param changes - Champs à mettre à jour
   */
  updateRestaurant(id: number, changes: Partial<Restaurant>): Observable<Restaurant | null> {
    const updated = this.storage.update<Restaurant>(STORAGE_KEYS.RESTAURANTS, id, changes);
    return of(updated).pipe(delay(400));
  }

  /**
   * Supprime un restaurant ET tous ses plats associés.
   * @param id - ID du restaurant à supprimer
   */
  deleteRestaurant(id: number): Observable<boolean> {
    // Supprime aussi tous les plats du restaurant
    const plats = this.storage.getAll<Plat>(STORAGE_KEYS.PLATS);
    const platsRestants = plats.filter(p => p.restaurantId !== id);
    this.storage.saveAll(STORAGE_KEYS.PLATS, platsRestants);

    const ok = this.storage.delete<Restaurant>(STORAGE_KEYS.RESTAURANTS, id);
    return of(ok).pipe(delay(400));
  }

  // ──────────────────────────────────────────────────────────────
  // PLATS — LECTURE
  // ──────────────────────────────────────────────────────────────

  /**
   * Retourne tous les plats d'un restaurant spécifique.
   * Utilisé dans la page détail du restaurant.
   * @param restaurantId - ID du restaurant
   */
  getPlats(restaurantId: number): Observable<Plat[]> {
    const all = this.storage.getAll<Plat>(STORAGE_KEYS.PLATS);
    return of(all.filter(p => p.restaurantId === restaurantId)).pipe(delay(150));
  }

  /** Retourne un plat par son ID */
  getPlatById(id: number): Observable<Plat | undefined> {
    return of(this.storage.getById<Plat>(STORAGE_KEYS.PLATS, id)).pipe(delay(100));
  }

  // ──────────────────────────────────────────────────────────────
  // PLATS — ÉCRITURE (CRUD)
  // ──────────────────────────────────────────────────────────────

  /**
   * Crée un nouveau plat pour un restaurant.
   * @param data - Données du plat (sans ID)
   */
  createPlat(data: Omit<Plat, 'id'>): Observable<Plat> {
    const newPlat = this.storage.create<Plat>(STORAGE_KEYS.PLATS, data);
    return of(newPlat).pipe(delay(400));
  }

  /**
   * Modifie un plat existant.
   * @param id      - ID du plat
   * @param changes - Champs à mettre à jour
   */
  updatePlat(id: number, changes: Partial<Plat>): Observable<Plat | null> {
    const updated = this.storage.update<Plat>(STORAGE_KEYS.PLATS, id, changes);
    return of(updated).pipe(delay(400));
  }

  /**
   * Supprime un plat.
   * @param id - ID du plat à supprimer
   */
  deletePlat(id: number): Observable<boolean> {
    const ok = this.storage.delete<Plat>(STORAGE_KEYS.PLATS, id);
    return of(ok).pipe(delay(300));
  }
}
