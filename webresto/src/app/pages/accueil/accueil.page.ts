import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from '../../core/services/restaurant.service';
import { RestaurantCardComponent } from '../../ui/restaurant-card/restaurant-card.component';
import { Categorie, Restaurant } from '../../core/models';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule, MatIconModule,
    RestaurantCardComponent
  ],
  templateUrl: './accueil.page.html',
  styleUrl: './accueil.page.scss'
})
export class AccueilPage implements OnInit, OnDestroy {

  categories:  Categorie[]  = [];
  restaurants: Restaurant[] = [];

  slides = [
    { continent: '🌏 Europe',       titre: 'Bienvenue chez',    sousTitre: 'WebRestO',                 description: 'Découvrez les meilleurs restaurants de votre localité et commandez en ligne. Livraison rapide, paiement à la livraison.', image: 'assets/Images/aceuil2.png' },
    { continent: '🌏 Asie',         titre: 'Ici vous trouverez',sousTitre: "De l'Orient",              description: "Sushi, Pho, Pad Thaï, Dim Sum… Les cuisines asiatiques n'ont plus de secrets pour nos restaurants partenaires.",           image: 'assets/Images/acceuil5.png' },
    { continent: '🌎 Amériques',    titre: 'Toutes les Saveurs',sousTitre: 'En Occident',              description: "Tacos mexicains, BBQ américain, poutine québécoise… L'Amérique dans toute sa diversité culinaire.",                         image: 'assets/Images/acceuil4.png' },
    { continent: '🌍 Afrique',      titre: 'Du',                sousTitre: "Passant par l'Afrique",   description: "Tajine, mafé, injera, thieboudienne… Une explosion de saveurs venues du continent aux mille cuisines.",                      image: 'assets/Images/africanFood.png' },
    { continent: '🕌 Moyen-Orient', titre: 'Monde',             sousTitre: "Jusqu'à la Méditerranée", description: 'Houmous, kebab, falafel, shawarma… Les saveurs envoûtantes du Moyen-Orient livrées chez vous.',                             image: 'assets/Images/aceuil3.png' }
  ];

  slideActuel   = 0;
  progression   = 0;

  private readonly TOTAL       = this.slides.length;
  private readonly INTERVALLE  = 5000;
  private timerId:    ReturnType<typeof setInterval> | null = null;
  private progressId: ReturnType<typeof setInterval> | null = null;

  constructor(public router: Router, private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.restaurantService.getCategories().subscribe(c => this.categories  = c);
    this.restaurantService.getAll().subscribe(r => this.restaurants = r);
    this.demarrerAutoPlay();
  }

  ngOnDestroy(): void { this.arreterAutoPlay(); }

  private demarrerAutoPlay(): void {
    const pas = 100 / (this.INTERVALLE / 100);
    this.progressId = setInterval(() => {
      this.progression = Math.min(this.progression + pas, 100);
    }, 100);
    this.timerId = setInterval(() => this.suivant(), this.INTERVALLE);
  }

  private arreterAutoPlay(): void {
    if (this.timerId)    clearInterval(this.timerId);
    if (this.progressId) clearInterval(this.progressId);
  }

  private redemarrer(): void {
    this.arreterAutoPlay();
    this.progression = 0;
    this.demarrerAutoPlay();
  }

  aller(n: number): void  { this.slideActuel = n; this.redemarrer(); }
  suivant(): void          { this.slideActuel = (this.slideActuel + 1) % this.TOTAL; this.progression = 0; }
  precedent(): void        { this.slideActuel = (this.slideActuel - 1 + this.TOTAL) % this.TOTAL; this.redemarrer(); }

  @HostListener('document:keydown', ['$event'])
  onTouche(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') this.suivant();
    if (e.key === 'ArrowLeft')  this.precedent();
  }

  allerCategorie(id: number): void {
    this.router.navigate(['/restaurants'], { queryParams: { cat: id } });
  }
}
