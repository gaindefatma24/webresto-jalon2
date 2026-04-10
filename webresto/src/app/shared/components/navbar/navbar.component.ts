import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Role } from '../../../core/models';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatBadgeModule,
    MatIconModule, MatMenuModule, MatDividerModule
  ],
  template: `
    <!-- MatToolbar remplace le <nav> custom -->
    <mat-toolbar class="app-toolbar" color="primary">

      <!-- Logo -->
      <a class="nav-brand" routerLink="/">
        <span>🍽️</span> WebResto
      </a>

      <span class="spacer"></span>

      <!-- Liens de navigation -->
      <div class="nav-links">
        <a mat-button routerLink="/" routerLinkActive="active-link"
           [routerLinkActiveOptions]="{exact:true}">Accueil</a>
        <a mat-button routerLink="/restaurants" routerLinkActive="active-link">Restaurants</a>

        <!-- CLIENT uniquement -->
        <ng-container *ngIf="auth.currentUser?.role === Role.CLIENT">
          <a mat-button routerLink="/cart" routerLinkActive="active-link">
            <span *ngIf="(cart.count$ | async)! > 0"
                  [matBadge]="cart.count$ | async"
                  matBadgeColor="accent"
                  matBadgeSize="small">
              🛒 Panier
            </span>
            <span *ngIf="(cart.count$ | async) === 0">🛒 Panier</span>
          </a>
          <a mat-button routerLink="/commandes" routerLinkActive="active-link">Commandes</a>
        </ng-container>

        <!-- RESTAURATEUR -->
        <a mat-button *ngIf="auth.currentUser?.role === Role.RESTAURATEUR"
           routerLink="/dashboard/restaurateur" routerLinkActive="active-link">
          Dashboard
        </a>

        <!-- LIVREUR -->
        <a mat-button *ngIf="auth.currentUser?.role === Role.LIVREUR"
           routerLink="/dashboard/livreur" routerLinkActive="active-link">
          Livraisons
        </a>
      </div>

      <!-- Authentification -->
      <div class="nav-auth">

        <!-- Non connecté -->
        <ng-container *ngIf="!auth.currentUser">
          <a mat-stroked-button routerLink="/login" class="btn-login">Connexion</a>
          <a mat-flat-button routerLink="/register" color="accent" class="btn-register">Inscription</a>
        </ng-container>

        <!-- Connecté : menu utilisateur -->
        <ng-container *ngIf="auth.currentUser">
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <span class="user-avatar">{{ auth.currentUser.prenom[0] }}</span>
            {{ auth.currentUser.prenom }}
            <span class="role-chip">{{ roleLabel }}</span>
          </button>
          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="menu-user-info">
              <strong>{{ auth.currentUser.prenom }} {{ auth.currentUser.nom }}</strong>
              <small>{{ auth.currentUser.email }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="router.navigate(['/profile'])">
              <mat-icon>manage_accounts</mat-icon>
              Mon profil
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              Déconnexion
            </button>
          </mat-menu>
        </ng-container>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .app-toolbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(12,10,9,0.92) !important;
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(46,42,39,0.5);
      padding: 0 1.5rem;
      height: 62px;
    }
    .nav-brand {
      font-family: var(--font-display); font-size: 1.35rem; font-weight: 700;
      color: var(--accent); text-decoration: none;
      display: flex; align-items: center; gap: .5rem; margin-right: 1.5rem;
    }
    .spacer { flex: 1 1 auto; }
    .nav-links { display: flex; align-items: center; gap: .25rem; }
    .nav-links a { color: var(--text-secondary) !important; font-size: .88rem !important; }
    .nav-links a:hover { color: var(--text-primary) !important; }
    .active-link { color: var(--accent) !important; background: var(--accent-soft) !important; border-radius: 8px; }
    .nav-auth { display: flex; align-items: center; gap: .6rem; margin-left: 1rem; }
    .btn-login { color: var(--text-secondary) !important; border-color: var(--border) !important; }
    .btn-register { background: var(--accent) !important; }
    .user-btn { color: var(--text-secondary) !important; display: flex; align-items: center; gap: .5rem; }
    .user-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--accent); color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: .8rem; font-weight: 700;
    }
    .role-chip {
      font-size: .72rem; background: var(--accent-soft); color: var(--accent);
      padding: 2px 8px; border-radius: 50px; margin-left: .25rem;
    }
    .menu-user-info {
      padding: .75rem 1rem; display: flex; flex-direction: column; gap: .1rem;
      strong { font-size: .9rem; color: var(--text-primary); }
      small  { font-size: .78rem; color: var(--text-muted); }
    }
    @media (max-width: 768px) { .nav-links { display: none; } }
  `]
})
export class NavbarComponent {
  Role = Role;
  constructor(public auth: AuthService, public cart: CartService, public router: Router) {}
  get roleLabel(): string {
    const m: Record<string, string> = { CLIENT: 'Client', RESTAURATEUR: 'Restaurateur', LIVREUR: 'Livreur' };
    return m[this.auth.currentUser?.role ?? ''] ?? '';
  }
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
