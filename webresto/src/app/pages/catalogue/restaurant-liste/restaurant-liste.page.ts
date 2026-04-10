import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { RestaurantCardComponent } from '../../../ui/restaurant-card/restaurant-card.component';
import { Restaurant, Categorie } from '../../../core/models';

@Component({
  selector: 'app-restaurant-liste',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatChipsModule, MatProgressSpinnerModule,
    RestaurantCardComponent
  ],
  templateUrl: './restaurant-liste.page.html',
  styleUrl: './restaurant-liste.page.scss'
})
export class RestaurantListePage implements OnInit {

  restaurants: Restaurant[] = [];
  filtres:     Restaurant[] = [];
  categories:  Categorie[]  = [];
  recherche    = '';
  categorieFiltree: number | null = null;
  chargement   = true;

  constructor(
    public  router: Router,
    private route:  ActivatedRoute,
    private restaurantService: RestaurantService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(p => {
      const cat = p.get('cat');
      this.categorieFiltree = cat ? Number(cat) : null;
      this.filtrer();
    });
    this.restaurantService.getCategories().subscribe(c => this.categories = c);
    this.restaurantService.getAll().subscribe(r => {
      this.restaurants = r;
      this.chargement  = false;
      this.filtrer();
    });
  }

  filtrer(): void {
    const q = this.recherche.toLowerCase();
    this.filtres = this.restaurants.filter(r => {
      const correspondRecherche = !q
        || r.nom.toLowerCase().includes(q)
        || r.description.toLowerCase().includes(q);
      const correspondCategorie = !this.categorieFiltree
        || r.categorieId === this.categorieFiltree;
      return correspondRecherche && correspondCategorie;
    });
  }

  reinitialiser(): void {
    this.recherche = '';
    this.categorieFiltree = null;
    this.filtrer();
  }
}
