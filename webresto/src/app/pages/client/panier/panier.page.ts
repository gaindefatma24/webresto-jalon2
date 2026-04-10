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
import { CartService } from '../../../core/services/cart.service';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {CartItem, StatutCommande} from '../../../core/models';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatCardModule, MatDividerModule, MatListModule
  ],
  templateUrl: './panier.page.html',
  styleUrl: './panier.page.scss'
})
export class PanierPage implements OnInit {

  adresseLivraison = '';

  constructor(
    public  cart:    CartService,
    private cmdSvc:  CommandeService,
    public  auth:    AuthService,
    private toast:   ToastService,
    public  router:  Router
  ) {}

  ngOnInit(): void {
    this.adresseLivraison = this.auth.currentUser?.adresse ?? '';
  }

  augmenter(item: CartItem): void  { this.cart.updateQty(item.plat.id,  1); }
  diminuer(item: CartItem): void   { this.cart.updateQty(item.plat.id, -1); }
  retirer(item: CartItem): void    { this.cart.removeItem(item.plat.id);    }
  vider(): void                    { this.cart.clear();                      }

  commander(): void {
    if (!this.adresseLivraison.trim()) {
      this.toast.show('⚠️ Entrez une adresse de livraison');
      return;
    }
    const user = this.auth.currentUser!;
    this.cmdSvc.placeOrder({
      clientId:         user.id,
      clientNom:        `${user.prenom} ${user.nom}`,
      restaurantId:     this.cart.restaurantId!,
      restaurantNom:    this.cart.restaurantNom,
      statut:           StatutCommande.EN_ATTENTE,
      lignes: this.cart.items.map(i => ({
        platId:       i.plat.id,
        nomPlat:      i.plat.nom,
        quantite:     i.quantite,
        prixUnitaire: i.plat.prix,
        sousTotal:    i.plat.prix * i.quantite
      })),
      adresseLivraison: this.adresseLivraison,
      total: this.cart.total
    }).subscribe(() => {
      this.cart.clear();
      this.toast.show('✅ Commande passée avec succès !');
      setTimeout(() => this.router.navigate(['/commandes']), 1200);
    });
  }
}
