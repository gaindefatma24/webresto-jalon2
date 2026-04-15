/**
 * ================================================================
 * CommandeService — Jalon II (remplace la version mock du Jalon I)
 * ================================================================
 * Tous les appels HTTP vont vers business_service (port 8082).
 * Le JWT est ajouté automatiquement par jwtInterceptor.
 * Les signatures sont identiques au Jalon I.
 * ================================================================
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande, StatutCommande } from '../models';
import {environment} from "../../../environments/environment";


@Injectable({ providedIn: 'root' })
export class CommandeService {

  private readonly BASE = `${environment.apiUrl}/commandes`;

  constructor(private http: HttpClient) {}

  // ── CLIENT ────────────────────────────────────────────────────────────────

  /** Mes commandes (clientId extrait du JWT côté serveur) */
  getMesCommandes(clientId: number): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.BASE}/mes-commandes`);
  }

  /** Créer une commande depuis le panier */
  placeOrder(order: Omit<Commande, 'id' | 'date'>): Observable<Commande> {
    return this.http.post<Commande>(`${this.BASE}`, order);
  }

  // ── RESTAURATEUR ──────────────────────────────────────────────────────────

  getCommandesRestaurant(restaurantId: number): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.BASE}/restaurant/${restaurantId}`);
  }

  getCommandesPourRestaurateur(restaurantIds: number[]): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.BASE}/mes-restaurants-commandes`);
  }

  updateStatut(id: number, statut: StatutCommande): Observable<Commande> {
    if (statut === StatutCommande.EN_PREPARATION) {
      return this.http.patch<Commande>(`${this.BASE}/${id}/accepter`, {});
    }
    if (statut === StatutCommande.ANNULEE) {
      return this.http.patch<Commande>(`${this.BASE}/${id}/annuler`, {});
    }
    if (statut === StatutCommande.LIVREE) {
      return this.http.patch<Commande>(`${this.BASE}/${id}/livrer`, {});
    }
    return this.http.patch<Commande>(`${this.BASE}/${id}/annuler`, {});
  }

  // ── LIVREUR ───────────────────────────────────────────────────────────────

  getCommandesDisponibles(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.BASE}/disponibles`);
  }

  getMesLivraisons(livreurId: number): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.BASE}/mes-livraisons`);
  }

  prendreEnCharge(commandeId: number, livreurId: number, livreurNom: string): Observable<Commande> {
    return this.http.patch<Commande>(`${this.BASE}/${commandeId}/prendre-en-charge`, { livreurNom });
  }

  confirmerLivraison(commandeId: number): Observable<Commande> {
    return this.http.patch<Commande>(`${this.BASE}/${commandeId}/livrer`, {});
  }
}
