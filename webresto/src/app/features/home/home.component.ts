import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Categorie, Restaurant } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page">

      <!-- ===== Slider 5 continents ===== -->
      <div class="hero">
        
        <!-- Images de fond -->
        <div class="hero-slides">
          <div class="hero-slide"
               *ngFor="let slide of slides; let i = index"
               [class.active]="currentSlide === i"
               [style.background-image]="'url(' + slide.image + ')'">
          </div>
        </div>
        
        <div class="hero-overlay"></div>

        <!-- Contenu texte -->
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            {{ slides[currentSlide].continent }}
          </div>
          <h1>{{ slides[currentSlide].titre }}<br><em>{{ slides[currentSlide].sousTitre }}</em></h1>
          <p>{{ slides[currentSlide].description }}</p>
          <!-- MatButton arrondi pour le CTA hero -->
          <button mat-flat-button color="primary" class="hero-cta"
                  (click)="router.navigate(['/restaurants'])">
            Explorer les restaurants
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>

        <!-- MatIconButton pour les flèches de navigation -->
        <button mat-icon-button class="hero-arrow left"  (click)="prev()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <button mat-icon-button class="hero-arrow right" (click)="next()">
          <mat-icon>arrow_forward</mat-icon>
        </button>
        
        <div class="hero-dots">
          <button class="hero-dot"
                  *ngFor="let slide of slides; let i = index"
                  [class.active]="currentSlide === i"
                  (click)="goTo(i)">
          </button>
        </div>

        <!-- Barre de progression auto-play -->
        <div class="hero-progress">
          <div class="hero-progress-fill" [style.width.%]="progressWidth"></div>
        </div>

      </div>

      <!-- Sous page presentation des menus en fonction des categories -->
      <div class="container">

        <!-- CATEGORIES — MatCard -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Catégories</h2>
          </div>
          <div class="cat-grid">
            <mat-card class="cat-card animate-in"
                 *ngFor="let c of categories"
                 (click)="goToCategory(c.id)">
              <mat-card-content>
                <span class="cat-icon">{{ c.icon }}</span>
                <div class="cat-name">{{ c.nom }}</div>
                <div class="cat-count">{{ c.count }} restaurant{{ c.count > 1 ? 's' : '' }}</div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- RESTAURANTS POPULAIRES — MatCard -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Restaurants populaires</h2>
            <button mat-button color="primary" (click)="router.navigate(['/restaurants'])">
              Voir tout <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
          <div class="resto-grid">
            <mat-card class="resto-card animate-in"
                 *ngFor="let r of restaurants"
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
                  {{ r.adresse }}
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`

    /* ─────────────────────────────────────
      Page d'aceuil slide images 
    ───────────────────────────────────── */
    .hero {
      position: relative;
      height: 100vh;
      overflow: hidden;
    }

    /* Slides */
    .hero-slides { position: absolute; inset: 0; z-index: 0; }

    .hero-slide {
      position: absolute; inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0;
      transform: scale(1.06);
      transition: opacity 6s ease, transform 6s ease;
    }
    .hero-slide.active {
      opacity: 1;
      transform: scale(1);
    }

    /* Overlay */
    .hero-overlay {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(
        to right,
        rgba(0,0,0,0.78) 0%,
        rgba(0,0,0,0.45) 55%,
        rgba(0,0,0,0.15) 100%
      );
    }

    /* Contenu */
    .hero-content {
      position: absolute; z-index: 2;
      top: 50%; left: 8%;
      transform: translateY(-50%);
      max-width: 580px;
    }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(12px);
      color: #fff;
      padding: 7px 18px; border-radius: 50px;
      font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
      margin-bottom: 22px;
    }

    .badge-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--accent);
      animation: badgePulse 2s ease-in-out infinite;
    }
    @keyframes badgePulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

    .hero h1 {
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 5vw, 3.8rem);
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #fff;
      margin-bottom: 1rem;
    }
    .hero h1 em {
      font-style: italic;
      color: var(--accent);
      text-decoration: underline;
      text-decoration-color: rgba(249,115,22,0.3);
      text-underline-offset: 6px;
    }

    .hero p {
      color: rgba(255,255,255,0.62);
      font-size: 1.05rem;
      line-height: 1.65;
      margin-bottom: 2rem;
      max-width: 440px;
    }

    .hero-cta {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 0.9rem 2.2rem;
      background: var(--accent); color: #fff;
      border-radius: 50px;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; border: none;
      font-family: var(--font-body);
      transition: all 0.3s;
      box-shadow: 0 4px 24px rgba(249,115,22,0.35);
    }
    .hero-cta:hover {
      background: var(--accent-hover);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(249,115,22,0.5);
    }

    /* Flèches */
    .hero-arrow {
      position: absolute; top: 50%; z-index: 10;
      transform: translateY(-50%);
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.18);
      color: #fff; font-size: 20px;
      cursor: pointer; backdrop-filter: blur(10px);
      transition: all 0.3s;
      display: flex; align-items: center; justify-content: center;
    }
    .hero-arrow:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.45);
    }
    .hero-arrow.left  { left: 2%; }
    .hero-arrow.right { right: 2%; }
    
    .hero-dots {
      position: absolute; bottom: 52px; left: 8%; z-index: 10;
      display: flex; gap: 10px;
    }
    .hero-dot {
      height: 4px; width: 28px; border-radius: 2px;
      background: rgba(255,255,255,0.25);
      border: none; cursor: pointer; padding: 0;
      transition: all 0.4s;
    }
    .hero-dot.active { width: 52px; background: var(--accent); }

    /* Progress bar */
    .hero-progress {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px; background: rgba(255,255,255,0.08); z-index: 10;
    }
    .hero-progress-fill {
      height: 100%; background: var(--accent);
      transition: width 1.6s linear;
    }

    /* ────────────────────────────────────────
       Section d'en bas presentation des menus
    ─────────────────────────────────────────── */
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: .85rem; }
    .cat-card {
      background: var(--bg-card) !important; border: 1px solid var(--border) !important;
      border-radius: var(--radius) !important; padding: 0 !important;
      text-align: center; cursor: pointer; transition: all .25s;
      mat-card-content { padding: 1.25rem 1rem !important; }
    }
    .cat-card:hover { border-color: var(--accent) !important; transform: translateY(-3px); box-shadow: var(--shadow-card); background: var(--bg-card-hover) !important; }
    .cat-icon  { font-size: 2.2rem; margin-bottom: .5rem; display: block; }
    .cat-name  { font-weight: 600; font-size: .92rem; margin-bottom: .15rem; }
    .cat-count { color: var(--text-muted); font-size: .78rem; }

    .resto-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 1.25rem; }
    .resto-card {
      background: var(--bg-card) !important; border: 1px solid var(--border) !important;
      border-radius: var(--radius) !important; overflow: hidden; padding: 0 !important;
      cursor: pointer; transition: all .25s;
      &:hover { border-color: var(--border-hover) !important; transform: translateY(-4px); box-shadow: var(--shadow-card); }
    }
    .resto-img {
      height: 175px; position: relative; overflow: hidden;
      display: flex; align-items: flex-end; padding: .75rem;
    }
    .resto-img::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(12,10,9,.85) 0%, rgba(12,10,9,.1) 60%); }
    .resto-img-bg { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform .4s; }
    .resto-card:hover .resto-img-bg { transform: scale(1.05); }
    .resto-tag { position: relative; z-index: 2; background: var(--accent); color: #fff; padding: .2rem .65rem; border-radius: 50px; font-size: .72rem; font-weight: 600; text-transform: uppercase; }
    .resto-body { padding: 1.1rem 1.25rem 1.25rem !important; }
    .resto-name { font-weight: 600; font-size: 1.05rem; margin-bottom: .3rem; }
    .resto-desc { color: var(--text-muted); font-size: .84rem; margin-bottom: .6rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .resto-meta { display: flex; align-items: center; gap: .3rem; color: var(--text-muted); font-size: .8rem; }

    @media (max-width: 768px) {
      .hero-content { left: 5%; right: 5%; }
      .hero-arrow   { display: none; }
      .hero h1      { font-size: 2rem; }
      .resto-grid   { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  categories: Categorie[] = [];
  restaurants: Restaurant[] = [];

  /* ── Données des 5 slides ── */
  slides = [
    {
      continent: '🌏 Europe',
      titre: 'Bienvenue chez',
      sousTitre: 'WebRestO',
      description: 'Découvrez les meilleurs restaurants de votre localité et commandez en ligne. Livraison rapide, paiement à la livraison.',
      image: 'assets/Images/aceuil2.png'
    },
    {
      continent: '🌏 Asie',
      titre: 'Ici vous trouverez',
      sousTitre: "De l'Orient",
      description: "Sushi, Pho, Pad Thaï, Dim Sum… Les cuisines asiatiques n'ont plus de secrets pour nos restaurants partenaires.",
      image: 'assets/Images/acceuil5.png'
    },
    {
      continent: '🌎 Amériques',
      titre: 'Toutes les Saveurs',
      sousTitre: 'En Occident',
      description: "Tacos mexicains, BBQ américain, poutine québécoise… L'Amérique dans toute sa diversité culinaire.",
      image: 'assets/Images/acceuil4.png'
    },
    {
      continent: '🌍 Afrique',
      titre: 'Du',
      sousTitre: "Passant par l'Afrique",
      description: "Tajine, mafé, injera, thieboudienne… Une explosion de saveurs venues du continent aux mille cuisines.",
      image: 'assets/Images/africanFood.png'
    },
    {
      continent: '🕌 Moyen-Orient',
      titre: 'Monde',
      sousTitre: "Jusqu'a la Méditerranée",
      description: 'Houmous, kebab, falafel, shawarma… Les saveurs envoûtantes du Moyen-Orient livrées chez vous.',
      image: 'assets/Images/aceuil3.png'
    }
  ];

  /* ── État slider ── */
  currentSlide  = 0;
  progressWidth = 0;
  private readonly TOTAL       = 5;
  private readonly INTERVAL_MS = 5000;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private progressId: ReturnType<typeof setInterval> | null = null;

  constructor(public router: Router, private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.restaurantService.getCategories().subscribe(c => this.categories = c);
    this.restaurantService.getAll().subscribe(r => this.restaurants = r);
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /* ── Annimation automatique── */
  private startAutoPlay(): void {
    const step = 10 / (this.INTERVAL_MS / 10);
    this.progressId = setInterval(() => {
      this.progressWidth = Math.min(this.progressWidth + step, 10);
    }, 100);
    this.intervalId = setInterval(() => this.next(), this.INTERVAL_MS);
  }

  private stopAutoPlay(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.progressId) clearInterval(this.progressId);
  }

  private restartAutoPlay(): void {
    this.stopAutoPlay();
    this.progressWidth = 0;
    this.startAutoPlay();
  }

  /* ── Navigation ── */
  goTo(n: number): void {
    this.currentSlide = n;
    this.restartAutoPlay();
  }

  next(): void {
    this.currentSlide = (this.currentSlide + 1) % this.TOTAL;
    this.progressWidth = 0;
  }

  prev(): void {
    this.currentSlide = (this.currentSlide - 1 + this.TOTAL) % this.TOTAL;
    this.restartAutoPlay();
  }

  /* ── Slider a l'aide du clavier── */
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft')  this.prev();
  }

  goToCategory(id: number): void {
    this.router.navigate(['/restaurants'], { queryParams: { cat: id } });
  }
}