import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant, Categorie } from '../../../core/models';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page">
      <div class="container">
        <div class="page-header">
          <div>
            <h1 class="page-title">Restaurants</h1>
            <p class="page-subtitle">{{ filtered.length }} restaurant(s) trouvé(s)</p>
          </div>
        </div>

        <!-- Barre de recherche — MatFormField + MatInput -->
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher un restaurant…</mat-label>
          <input matInput [(ngModel)]="query" (ngModelChange)="filter()" placeholder="Pizza, Sushi…">
          <mat-icon matPrefix>search</mat-icon>
          <button mat-icon-button matSuffix *ngIf="query" (click)="query=''; filter()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <!-- Filtres catégories — MatChipListbox -->
        <mat-chip-listbox class="cat-chips" [(ngModel)]="activeCat" (change)="filter()">
          <mat-chip-option [value]="null" [selected]="activeCat === null">Tous</mat-chip-option>
          <mat-chip-option *ngFor="let c of categories" [value]="c.id">
            {{ c.icon }} {{ c.nom }}
          </mat-chip-option>
        </mat-chip-listbox>

        <!-- Spinner de chargement -->
        <div class="loading-center" *ngIf="loading">
          <mat-spinner diameter="48"></mat-spinner>
        </div>

        <!-- Grille des restaurants -->
        <div class="resto-grid" *ngIf="!loading">

          <!-- État vide -->
          <div class="empty-state" *ngIf="filtered.length === 0" style="grid-column:1/-1">
            <mat-icon class="empty-icon">search_off</mat-icon>
            <p>Aucun restaurant trouvé</p>
            <button mat-stroked-button (click)="reset()">Réinitialiser</button>
          </div>

          <!-- MatCard pour chaque restaurant -->
          <mat-card class="resto-card animate-in"
                    *ngFor="let r of filtered"
                    (click)="router.navigate(['/restaurants', r.id])">
            <div class="resto-img">
              <div class="resto-img-bg" [style.background-image]="'url(' + r.imageUrl + ')'"></div>
              <span class="resto-tag">{{ r.categorie }}</span>
            </div>
            <mat-card-content class="resto-body">
              <div class="resto-name">{{ r.nom }}</div>
              <div class="resto-desc">{{ r.description }}</div>
              <div class="resto-meta">
                <mat-icon style="font-size:14px;width:14px;height:14px">location_on</mat-icon>
                {{ r.adresse }}, {{ r.ville }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .search-field { width:100%; margin-bottom:1rem; }
    .cat-chips { margin-bottom:1.5rem; display:flex; flex-wrap:wrap; gap:.4rem; }
    .loading-center { display:flex; justify-content:center; padding:3rem; }
    .resto-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(310px,1fr)); gap:1.25rem; }
    .resto-card {
      background:var(--bg-card) !important; border:1px solid var(--border) !important;
      border-radius:var(--radius) !important; overflow:hidden; cursor:pointer;
      transition:all .25s; padding:0 !important;
      &:hover { border-color:var(--border-hover) !important; transform:translateY(-4px); box-shadow:var(--shadow-card); }
    }
    .resto-img { height:175px; position:relative; overflow:hidden; display:flex; align-items:flex-end; padding:.75rem; }
    .resto-img::after { content:''; position:absolute; inset:0; background:linear-gradient(to top, rgba(12,10,9,.85) 0%, rgba(12,10,9,.1) 60%); }
    .resto-img-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:transform .4s; }
    .resto-card:hover .resto-img-bg { transform:scale(1.05); }
    .resto-tag { position:relative; z-index:2; background:var(--accent); color:#fff; padding:.2rem .65rem; border-radius:50px; font-size:.72rem; font-weight:600; text-transform:uppercase; }
    .resto-body { padding:1.1rem 1.25rem 1.25rem !important; }
    .resto-name { font-weight:600; font-size:1.05rem; margin-bottom:.3rem; }
    .resto-desc { color:var(--text-muted); font-size:.84rem; margin-bottom:.6rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .resto-meta { display:flex; align-items:center; gap:.3rem; color:var(--text-muted); font-size:.8rem; }
    .empty-state { text-align:center; padding:3rem; mat-icon { font-size:3rem; width:3rem; height:3rem; color:var(--text-muted); display:block; margin:0 auto .75rem; } p { color:var(--text-muted); margin-bottom:1rem; } }
    @media (max-width:768px) { .resto-grid { grid-template-columns:1fr; } }
  `]
})
export class RestaurantListComponent implements OnInit {
  restaurants: Restaurant[] = [];
  filtered:    Restaurant[] = [];
  categories:  Categorie[]  = [];
  query     = '';
  activeCat: number | null = null;
  loading   = true;

  constructor(public router: Router, private route: ActivatedRoute, private restoService: RestaurantService) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(p => {
      const cat = p.get('cat');
      this.activeCat = cat ? Number(cat) : null;
    });
    this.restoService.getCategories().subscribe(c => this.categories = c);
    this.restoService.getAll().subscribe(r => {
      this.restaurants = r; this.loading = false; this.filter();
    });
  }

  filter(): void {
    const q = this.query.toLowerCase();
    this.filtered = this.restaurants.filter(r => {
      const matchQ   = !q || r.nom.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchCat = !this.activeCat || r.categorieId === this.activeCat;
      return matchQ && matchCat;
    });
  }

  reset(): void { this.query = ''; this.activeCat = null; this.filter(); }
}
