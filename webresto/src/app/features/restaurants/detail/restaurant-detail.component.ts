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
  template: `
    <div class="page" *ngIf="restaurant">
      <!-- HERO -->
      <div class="detail-hero">
        <div class="detail-hero-bg" [style.background-image]="'url(' + restaurant.imageUrl + ')'"></div>
        <div class="detail-hero-content">
          <!-- MatChip pour la catégorie -->
          <mat-chip-set>
            <mat-chip class="cat-chip">{{ restaurant.categorie }}</mat-chip>
          </mat-chip-set>
          <h1>{{ restaurant.nom }}</h1>
          <p>{{ restaurant.description }}</p>
          <div class="detail-info">
            <span>
              <mat-icon style="font-size:16px;vertical-align:middle">location_on</mat-icon>
              {{ restaurant.adresse }}, {{ restaurant.ville }}
            </span>
            <span>
              <mat-icon style="font-size:16px;vertical-align:middle">phone</mat-icon>
              {{ restaurant.telephone }}
            </span>
          </div>
        </div>
      </div>

      <div class="container">
        <h2 class="section-title" style="margin-bottom:1.25rem">Menu</h2>
        <div class="plat-grid">
          <!-- MatCard pour chaque plat -->
          <mat-card class="plat-card animate-in" *ngFor="let p of plats">
            <div class="plat-img" [style.background-image]="'url(' + p.imageUrl + ')'">
              <span class="plat-price">{{ p.prix | number:'1.2-2' }} $</span>
            </div>
            <mat-card-content class="plat-body">
              <div class="plat-name">{{ p.nom }}</div>
              <div class="plat-desc">{{ p.description }}</div>

              <ng-container *ngIf="currentUser as user; else guestAction">
                <!-- MatButton pour ajouter au panier -->
                <button mat-stroked-button color="primary" class="btn-add-cart"
                        *ngIf="user.role === Role.CLIENT"
                        (click)="addToCart(p)">
                  <mat-icon>add_shopping_cart</mat-icon>
                  Ajouter au panier
                </button>
              </ng-container>
              <ng-template #guestAction>
                <div class="login-prompt">
                  <a mat-button color="primary"
                     (click)="router.navigate(['/login'])">Connectez-vous</a>
                  pour commander
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-hero { height: 280px; position: relative; overflow: hidden; }
    .detail-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
    .detail-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-deep) 0%, rgba(12,10,9,.3) 50%); }
    .detail-hero-content {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 2rem; z-index: 2;
      max-width: 1240px; margin: 0 auto;
    }
    .cat-chip { background: var(--accent) !important; color: #fff !important; margin-bottom: .6rem; }
    .detail-hero-content h1 { font-family: var(--font-display); font-size: 2.4rem; font-weight: 700; letter-spacing: -.02em; margin-bottom: .5rem; }
    .detail-hero-content p { color: var(--text-secondary); font-size: 1rem; margin-bottom: .5rem; }
    .detail-info { display: flex; gap: 1.5rem; color: var(--text-muted); font-size: .88rem; flex-wrap: wrap; align-items: center; }

    .plat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.15rem; }
    .plat-card {
      background: var(--bg-card) !important; border: 1px solid var(--border) !important;
      border-radius: var(--radius) !important; overflow: hidden; padding: 0 !important;
      transition: all .2s;
      &:hover { border-color: var(--border-hover) !important; transform: translateY(-2px); }
    }
    .plat-img {
      height: 145px; position: relative;
      background-size: cover; background-position: center;
    }
    .plat-price {
      position: absolute; bottom: .6rem; right: .6rem;
      background: rgba(12,10,9,.8); backdrop-filter: blur(8px);
      color: var(--accent); padding: .3rem .7rem;
      border-radius: var(--radius-sm); font-weight: 700; font-size: .95rem;
    }
    .plat-body { padding: 1rem 1.15rem 1.15rem !important; }
    .plat-name { font-weight: 600; font-size: .95rem; margin-bottom: .25rem; }
    .plat-desc { color: var(--text-muted); font-size: .82rem; margin-bottom: .85rem; line-height: 1.4; }
    .btn-add-cart { width: 100%; }
    .login-prompt { color: var(--text-muted); font-size: .84rem; display: flex; align-items: center; }
    @media (max-width: 768px) {
      .plat-grid { grid-template-columns: 1fr 1fr; }
      .detail-hero-content h1 { font-size: 1.8rem; }
    }
    @media (max-width: 480px) { .plat-grid { grid-template-columns: 1fr; } }
  `]
})
export class RestaurantDetailComponent implements OnInit {
  restaurant?: Restaurant;
  plats: Plat[] = [];
  Role = Role;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private restaurantService: RestaurantService,
    private cartService: CartService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  get currentUser(): User | null { return this.auth.currentUser; }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.restaurantService.getById(id).subscribe(r => this.restaurant = r);
    this.restaurantService.getPlats(id).subscribe(p => this.plats = p);
  }

  addToCart(plat: Plat): void {
    if (!this.restaurant) return;
    const added = this.cartService.addItem(plat, this.restaurant.id, this.restaurant.nom);
    if (!added) {
      if (confirm('Votre panier contient des plats d\'un autre restaurant. Vider le panier ?')) {
        this.cartService.clear();
        this.cartService.addItem(plat, this.restaurant!.id, this.restaurant!.nom);
        this.toast.show('✓ ' + plat.nom + ' ajouté au panier');
      }
    } else {
      this.toast.show('✓ ' + plat.nom + ' ajouté au panier');
    }
  }
}
