/**
 * ================================================================
 * CommandeService — Gestion réelle des commandes (Jalon I)
 * ================================================================
 *
 * Ce service gère le cycle de vie complet d'une commande :
 *
 *   CLIENT crée une commande (statut: EN_ATTENTE)
 *     ↓
 *   RESTAURATEUR accepte (EN_PREPARATION) ou refuse (ANNULEE)
 *     ↓
 *   LIVREUR prend en charge (EN_LIVRAISON)
 *     ↓
 *   LIVREUR confirme la livraison (LIVREE)
 *
 * Les commandes sont gérées en mémoire via StorageService (Jalon I).
 * Un client peut voir ses propres commandes.
 * Un restaurateur voit les commandes de ses restaurants.
 * Un livreur voit les commandes disponibles et les siennes.
 * ================================================================
 */

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Commande, StatutCommande } from '../models';
import { StorageService, STORAGE_KEYS } from './storage.service';

@Injectable({ providedIn: 'root' })
export class CommandeService {

  constructor(private storage: StorageService) {}

  // ──────────────────────────────────────────────────────────────
  // LECTURE DES COMMANDES
  // ──────────────────────────────────────────────────────────────

  /**
   * Retourne TOUTES les commandes d'un client (par son ID).
   * Triées par date décroissante (la plus récente en premier).
   * @param clientId - ID du client connecté
   */
  getMesCommandes(clientId: number): Observable<Commande[]> {
    const all = this.storage.getAll<Commande>(STORAGE_KEYS.COMMANDES);
    const mine = all
      .filter(c => c.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return of(mine).pipe(delay(200));
  }

  /**
   * Retourne toutes les commandes pour un restaurant spécifique.
   * Utilisé dans le dashboard restaurateur.
   * @param restaurantId - ID du restaurant
   */
  getCommandesRestaurant(restaurantId: number): Observable<Commande[]> {
    const all = this.storage.getAll<Commande>(STORAGE_KEYS.COMMANDES);
    const filtered = all
      .filter(c => c.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return of(filtered).pipe(delay(200));
  }

  /**
   * Retourne toutes les commandes des restaurants d'un restaurateur.
   * @param restaurantIds - Liste des IDs des restaurants du restaurateur
   */
  getCommandesPourRestaurateur(restaurantIds: number[]): Observable<Commande[]> {
    const all = this.storage.getAll<Commande>(STORAGE_KEYS.COMMANDES);
    const filtered = all
      .filter(c => restaurantIds.includes(c.restaurantId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return of(filtered).pipe(delay(200));
  }

  /**
   * Retourne les commandes disponibles pour les livreurs.
   * = Commandes en statut EN_PREPARATION sans livreur assigné.
   */
  getCommandesDisponibles(): Observable<Commande[]> {
    const all = this.storage.getAll<Commande>(STORAGE_KEYS.COMMANDES);
    const disponibles = all.filter(
      c => c.statut === StatutCommande.EN_PREPARATION && !c.livreurId
    );
    return of(disponibles).pipe(delay(200));
  }

  /**
   * Retourne les livraisons assignées à un livreur spécifique.
   * @param livreurId - ID du livreur connecté
   */
  getMesLivraisons(livreurId: number): Observable<Commande[]> {
    const all = this.storage.getAll<Commande>(STORAGE_KEYS.COMMANDES);
    const mine = all
      .filter(c => c.livreurId === livreurId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return of(mine).pipe(delay(200));
  }

  // ──────────────────────────────────────────────────────────────
  // CRÉATION DE COMMANDE
  // ──────────────────────────────────────────────────────────────

  /**
   * Crée et persiste une nouvelle commande.
   * Appelé quand le client clique sur "Commander" dans le panier.
   *
   * @param order - Données de la commande (sans ID, sans date)
   * @returns La commande créée avec son ID et sa date
   */
  placeOrder(order: Omit<Commande, 'id' | 'date'>): Observable<Commande> {
    const now = new Date();
    // Format date lisible : "2025-02-10 18:34"
    const dateFormatted = now.toLocaleDateString('fr-CA') + ' '
      + now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });

    const newCommande = this.storage.create<Commande>(STORAGE_KEYS.COMMANDES, {
      ...order,
      date: dateFormatted,
      statut: StatutCommande.EN_ATTENTE // Toujours EN_ATTENTE à la création
    });

    console.log('[CommandeService] Commande créée:', newCommande);
    return of(newCommande).pipe(delay(600));
  }

  // ──────────────────────────────────────────────────────────────
  // MISE À JOUR DU STATUT
  // ──────────────────────────────────────────────────────────────

  /**
   * Met à jour le statut d'une commande.
   * Utilisé par le restaurateur (accepter/refuser) et le livreur (livrer).
   *
   * @param id     - ID de la commande
   * @param statut - Nouveau statut
   */
  updateStatut(id: number, statut: StatutCommande): Observable<Commande | null> {
    const updated = this.storage.update<Commande>(
      STORAGE_KEYS.COMMANDES, id, { statut }
    );
    return of(updated).pipe(delay(300));
  }

  /**
   * Assigne une commande à un livreur et passe en EN_LIVRAISON.
   * Appelé quand le livreur clique sur "Prendre en charge".
   *
   * @param commandeId - ID de la commande à prendre
   * @param livreurId  - ID du livreur connecté
   * @param livreurNom - Nom complet du livreur (pour affichage)
   */
  prendreEnCharge(
    commandeId: number,
    livreurId: number,
    livreurNom: string
  ): Observable<Commande | null> {
    const updated = this.storage.update<Commande>(
      STORAGE_KEYS.COMMANDES,
      commandeId,
      {
        livreurId,
        livreurNom,
        statut: StatutCommande.EN_LIVRAISON
      }
    );
    return of(updated).pipe(delay(300));
  }

  /**
   * Confirme la livraison d'une commande.
   * Passe le statut à LIVREE.
   * @param commandeId - ID de la commande livrée
   */
  confirmerLivraison(commandeId: number): Observable<Commande | null> {
    return this.updateStatut(commandeId, StatutCommande.LIVREE);
  }
}
