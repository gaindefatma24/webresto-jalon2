import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { CartService } from '../../core/services/cart.service';
import { CommandeService } from '../../core/services/commande.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {CartItem, StatutCommande} from '../../core/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatCardModule, MatDividerModule, MatListModule
  ],
  template: `
    <div class="page">
      <div class="container-mid">
        <h1 class="page-title">🛒 Mon Panier</h1>

        <!-- Panier vide -->
        <div class="empty-state" *ngIf="(cart.items$ | async)?.length === 0">
          <mat-icon class="empty-icon">shopping_cart</mat-icon>
          <p>Votre panier est vide</p>
          <button mat-flat-button color="primary" (click)="router.navigate(['/restaurants'])">
            Parcourir les restaurants
          </button>
        </div>

        <!-- Panier avec articles -->
        <ng-container *ngIf="(cart.items$ | async)?.length! > 0">

          <!-- En-tête restaurant + bouton vider -->
          <div class="cart-header">
            <h2>{{ cart.restaurantNom$ | async }}</h2>
            <button mat-stroked-button color="warn" (click)="vider()">
              <mat-icon>delete_sweep</mat-icon> Vider
            </button>
          </div>

          <!-- MatList pour les articles -->
          <mat-card class="items-card">
            <mat-list>
              <mat-list-item *ngFor="let item of (cart.items$ | async); let last = last"
                             class="cart-list-item">
                <div class="item-row">
                  <div class="item-info">
                    <span class="item-name">{{ item.plat.nom }}</span>
                    <span class="item-unit">{{ item.plat.prix | number:'1.2-2' }} $ / unité</span>
                  </div>

                  <!-- Contrôles quantité avec MatIconButton -->
                  <div class="item-qty">
                    <button mat-icon-button (click)="moins(item)" class="qty-btn">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="qty-val">{{ item.quantite }}</span>
                    <button mat-icon-button (click)="plus(item)" class="qty-btn">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>

                  <span class="item-total">
                    {{ (item.plat.prix * item.quantite) | number:'1.2-2' }} $
                  </span>

                  <button mat-icon-button (click)="retirer(item)" class="remove-btn">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <mat-divider *ngIf="!last"></mat-divider>
              </mat-list-item>
            </mat-list>
          </mat-card>

          <!-- Résumé total -->
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-row">
                <span class="summary-label">Total</span>
                <span class="summary-total">{{ cart.total$ | async | number:'1.2-2' }} $</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Adresse de livraison — MatFormField -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Adresse de livraison</mat-label>
            <input matInput [(ngModel)]="adresse" placeholder="Entrez votre adresse complète">
            <mat-icon matSuffix>location_on</mat-icon>
          </mat-form-field>

          <!-- Bouton commander -->
          <button mat-flat-button color="primary" class="cmd-btn"
                  (click)="commander()" [disabled]="!adresse.trim()">
            Commander — {{ cart.total$ | async | number:'1.2-2' }} $
          </button>

          <p class="payment-note">
            <mat-icon style="font-size:16px;vertical-align:middle">info</mat-icon>
            Le paiement se fera à la livraison
          </p>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-family:var(--font-display); font-size:1.8rem; margin-bottom:1.5rem; }
    .empty-state { text-align:center; padding:3rem; mat-icon { font-size:3rem; width:3rem; height:3rem; color:var(--text-muted); display:block; margin:0 auto .75rem; } p { color:var(--text-muted); margin-bottom:1.25rem; } }
    .cart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; h2 { font-size:1.1rem; } }
    .items-card { background:var(--bg-card) !important; border:1px solid var(--border) !important; margin-bottom:1rem; }
    .cart-list-item { height:auto !important; padding:0 !important; }
    .item-row { display:flex; align-items:center; gap:1rem; padding:.75rem 1rem; width:100%; }
    .item-info { flex:1; }
    .item-name { font-weight:600; font-size:.95rem; display:block; }
    .item-unit { color:var(--text-muted); font-size:.8rem; }
    .item-qty { display:flex; align-items:center; gap:.4rem; }
    .qty-btn { width:30px !important; height:30px !important; line-height:30px !important; }
    .qty-val { font-weight:600; min-width:24px; text-align:center; }
    .item-total { color:var(--accent); font-weight:700; min-width:70px; text-align:right; font-size:.95rem; }
    .remove-btn { color:var(--text-muted) !important; &:hover { color:var(--danger) !important; } }
    .summary-card { background:var(--bg-card) !important; border:1px solid var(--border) !important; margin-bottom:1rem; }
    .summary-row { display:flex; justify-content:space-between; align-items:center; }
    .summary-label { font-size:1.1rem; font-weight:600; }
    .summary-total { font-size:1.3rem; font-weight:700; color:var(--accent); font-family:var(--font-display); }
    .full-width { width:100%; margin-bottom:.5rem; }
    .cmd-btn { width:100%; height:52px; font-size:1rem !important; }
    .payment-note { text-align:center; color:var(--text-muted); font-size:.85rem; margin-top:.75rem; }
  `]
})
export class CartComponent implements OnInit {
  adresse = '';

  constructor(
    public  cart: CartService,
    private commandeService: CommandeService,
    public  auth: AuthService,
    private toast: ToastService,
    public  router: Router
  ) {}

  ngOnInit(): void { this.adresse = this.auth.currentUser?.adresse ?? ''; }

  plus(item: CartItem):    void { this.cart.updateQty(item.plat.id, 1);  }
  moins(item: CartItem):   void { this.cart.updateQty(item.plat.id, -1); }
  retirer(item: CartItem): void { this.cart.removeItem(item.plat.id);    }
  vider():                  void { this.cart.clear(); }

  commander(): void {
    if (!this.adresse.trim()) { this.toast.show('⚠️ Entrez une adresse de livraison'); return; }
    const items = this.cart.items;
    const total = this.cart.total;
    const user  = this.auth.currentUser!;
    this.commandeService.placeOrder({
      clientId:         user.id,
      clientNom:        `${user.prenom} ${user.nom}`,
      restaurantId:     this.cart.restaurantId!,
      restaurantNom:    this.cart.restaurantNom,
      statut:           StatutCommande.EN_ATTENTE,
      lignes: items.map(i => ({
        platId:       i.plat.id,
        nomPlat:      i.plat.nom,
        quantite:     i.quantite,
        prixUnitaire: i.plat.prix,
        sousTotal:    i.plat.prix * i.quantite
      })),
      adresseLivraison: this.adresse,
      total
    }).subscribe(() => {
      this.cart.clear();
      this.toast.show('✅ Commande passée avec succès !');
      setTimeout(() => this.router.navigate(['/commandes']), 1200);
    });
  }
}
