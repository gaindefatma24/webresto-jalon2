import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Restaurant, Plat, User, Role } from '../../../core/models';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './restaurant-detail.page.html',
  styleUrl: './restaurant-detail.page.scss'
})
export class RestaurantDetailPage implements OnInit {

  restaurant?: Restaurant;
  plats: Plat[] = [];
  Role = Role;

  constructor(
    public  router:  Router,
    private route:   ActivatedRoute,
    private restaurantService: RestaurantService,
    private cartService:       CartService,
    private auth:              AuthService,
    private toast:             ToastService
  ) {}

  get utilisateurConnecte(): User | null { return this.auth.currentUser; }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.restaurantService.getById(id).subscribe(r => this.restaurant = r);
    this.restaurantService.getPlats(id).subscribe(p => this.plats = p);
  }

  ajouterAuPanier(plat: Plat): void {
    if (!this.restaurant) return;
    const ajoute = this.cartService.addItem(plat, this.restaurant.id, this.restaurant.nom);
    if (!ajoute) {
      if (confirm("Votre panier contient des plats d'un autre restaurant. Vider le panier ?")) {
        this.cartService.clear();
        this.cartService.addItem(plat, this.restaurant!.id, this.restaurant!.nom);
        this.toast.show('✓ ' + plat.nom + ' ajouté au panier');
      }
    } else {
      this.toast.show('✓ ' + plat.nom + ' ajouté au panier');
    }
  }
}
