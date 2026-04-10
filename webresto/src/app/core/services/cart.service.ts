/**
 * ================================================================
 * CartService — Gestion du panier
 * ================================================================
 *
 * Service singleton qui maintient l'état du panier en mémoire.
 * Utilise des BehaviorSubjects pour une réactivité en temps réel.
 *
 * Le panier est lié à UN SEUL restaurant à la fois.
 * Si l'utilisateur ajoute un plat d'un autre restaurant,
 * on propose de vider le panier (comportement UberEats / DoorDash).
 *
 * Données exposées via Observables :
 *   items$         → liste des CartItem
 *   total$         → montant total calculé
 *   count$         → nombre total d'articles (pour le badge)
 *   restaurantNom$ → nom du resto actif dans le panier
 * ================================================================
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem, Plat } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {

  // ── Streams réactifs ──────────────────────────────────────────

  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  private restaurantIdSubject = new BehaviorSubject<number | null>(null);
  private restaurantNomSubject = new BehaviorSubject<string>('');

  /** Observable des articles du panier */
  items$ = this.itemsSubject.asObservable();

  /** Observable du montant total */
  total$ = this.items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.plat.prix * i.quantite, 0))
  );

  /** Observable du nombre d'articles (pour le badge navbar) */
  count$ = this.items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.quantite, 0))
  );

  /** Observable du nom du restaurant actif */
  restaurantNom$ = this.restaurantNomSubject.asObservable();

  // ── Accesseurs synchrones (utiles dans les templates et CartComponent) ──

  get items(): CartItem[] { return this.itemsSubject.value; }
  get restaurantId(): number | null { return this.restaurantIdSubject.value; }
  get restaurantNom(): string { return this.restaurantNomSubject.value; }
  get total(): number {
    return this.items.reduce((sum, i) => sum + i.plat.prix * i.quantite, 0);
  }

  // ──────────────────────────────────────────────────────────────
  // OPÉRATIONS SUR LE PANIER
  // ──────────────────────────────────────────────────────────────

  /**
   * Ajoute un plat au panier.
   * Retourne false si le plat vient d'un AUTRE restaurant
   * (l'appelant doit demander confirmation à l'utilisateur).
   *
   * @param plat          - Le plat à ajouter
   * @param restaurantId  - ID du restaurant du plat
   * @param restaurantNom - Nom du restaurant (pour l'affichage)
   */
  addItem(plat: Plat, restaurantId: number, restaurantNom: string): boolean {
    // Détection de conflit de restaurant
    if (this.restaurantId && this.restaurantId !== restaurantId) {
      return false; // Signal de conflit → CartComponent gère la confirmation
    }

    // Initialise le restaurant si le panier était vide
    this.restaurantIdSubject.next(restaurantId);
    this.restaurantNomSubject.next(restaurantNom);

    const currentItems = [...this.items];
    const existingIndex = currentItems.findIndex(i => i.plat.id === plat.id);

    if (existingIndex >= 0) {
      // Incrémente la quantité si le plat est déjà dans le panier
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantite: currentItems[existingIndex].quantite + 1
      };
    } else {
      // Ajoute le nouveau plat
      currentItems.push({ plat, quantite: 1 });
    }

    this.itemsSubject.next(currentItems);
    return true;
  }

  /**
   * Ajuste la quantité d'un article (+delta ou -delta).
   * Si la quantité atteint 0, l'article est supprimé.
   * @param platId - ID du plat à modifier
   * @param delta  - +1 ou -1
   */
  updateQty(platId: number, delta: number): void {
    const updated = this.items
      .map(i => i.plat.id === platId ? { ...i, quantite: i.quantite + delta } : i)
      .filter(i => i.quantite > 0); // Supprime si quantité <= 0

    this.itemsSubject.next(updated);
    if (updated.length === 0) this.clear();
  }

  /**
   * Supprime un article du panier.
   * Vide aussi les infos restaurant si le panier devient vide.
   */
  removeItem(platId: number): void {
    const filtered = this.items.filter(i => i.plat.id !== platId);
    this.itemsSubject.next(filtered);
    if (filtered.length === 0) this.clear();
  }

  /** Vide complètement le panier et remet à zéro le restaurant actif */
  clear(): void {
    this.itemsSubject.next([]);
    this.restaurantIdSubject.next(null);
    this.restaurantNomSubject.next('');
  }
}
