/**
 * ================================================================
 * RestaurantService — Jalon II (remplace la version mock du Jalon I)
 * ================================================================
 * Tous les appels HTTP vont vers business_service (port 8082).
 * Le JWT est ajouté automatiquement par jwtInterceptor.
 * Les signatures de méthodes sont IDENTIQUES au Jalon I pour
 * ne pas casser les composants Angular existants.
 * ================================================================
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Restaurant, Plat, Categorie } from '../models';
import {environment} from "../../../environments/environment";


@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private readonly BASE = environment.apiUrl; // http://localhost:8082/api

  constructor(private http: HttpClient) {}

  // ── CATÉGORIES ────────────────────────────────────────────────────────────

  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.BASE}/categories`);
  }

  // ── RESTAURANTS — LECTURE ─────────────────────────────────────────────────

  getAll(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.BASE}/restaurants`);
  }

  getById(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.BASE}/restaurants/${id}`);
  }

  getByProprietaire(proprietaireId: number): Observable<Restaurant[]> {
    // Route dédiée : GET /api/restaurants/mes-restaurants (JWT requis)
    return this.http.get<Restaurant[]>(`${this.BASE}/restaurants/mes-restaurants`);
  }

  search(query: string, catId?: number | null): Observable<Restaurant[]> {
    let params = new HttpParams();
    if (query) params = params.set('nom', query);
    if (catId) params = params.set('categorieId', catId.toString());
    return this.http.get<Restaurant[]>(`${this.BASE}/restaurants/search`, { params });
  }

  // ── RESTAURANTS — ÉCRITURE ────────────────────────────────────────────────

  createRestaurant(data: Omit<Restaurant, 'id' | 'proprietaireId'>, proprietaireId: number): Observable<Restaurant> {
    // proprietaireId est extrait du JWT côté serveur, inutile de l'envoyer
    return this.http.post<Restaurant>(`${this.BASE}/restaurants`, data);
  }

  updateRestaurant(id: number, changes: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.BASE}/restaurants/${id}`, changes);
  }

  deleteRestaurant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/restaurants/${id}`);
  }

  // ── PLATS — LECTURE ───────────────────────────────────────────────────────

  getPlats(restaurantId: number): Observable<Plat[]> {
    return this.http.get<Plat[]>(`${this.BASE}/restaurants/${restaurantId}/plats`);
  }

  getPlatById(id: number): Observable<Plat> {
    return this.http.get<Plat>(`${this.BASE}/plats/${id}`);
  }

  // ── PLATS — ÉCRITURE ──────────────────────────────────────────────────────

  createPlat(data: Omit<Plat, 'id'>): Observable<Plat> {
    const { restaurantId, ...body } = data;
    return this.http.post<Plat>(`${this.BASE}/restaurants/${restaurantId}/plats`, body);
  }

  updatePlat(id: number, changes: Partial<Plat>): Observable<Plat> {
    return this.http.put<Plat>(`${this.BASE}/plats/${id}`, changes);
  }

  deletePlat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/plats/${id}`);
  }
}
