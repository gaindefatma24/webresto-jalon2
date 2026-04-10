import { Routes } from '@angular/router';
import { Role } from './core/models';
import { authGuard, roleGuard } from './core/guards/guards';

export const routes: Routes = [

  // ── PUBLIQUES ─────────────────────────────────────────────────
  { path: '', loadComponent: () => import('./pages/accueil/accueil.page').then(m => m.AccueilPage), title: 'WebResto — Accueil' },
  { path: 'restaurants', loadComponent: () => import('./pages/catalogue/restaurant-liste/restaurant-liste.page').then(m => m.RestaurantListePage), title: 'Restaurants — WebResto' },
  { path: 'restaurants/:id', loadComponent: () => import('./pages/catalogue/restaurant-detail/restaurant-detail.page').then(m => m.RestaurantDetailPage), title: 'Menu — WebResto' },
  { path: 'connexion', loadComponent: () => import('./pages/auth/connexion/connexion.page').then(m => m.ConnexionPage), title: 'Connexion — WebResto' },
  { path: 'login',    redirectTo: 'connexion' },
  { path: 'inscription', loadComponent: () => import('./pages/auth/inscription/inscription.page').then(m => m.InscriptionPage), title: 'Inscription — WebResto' },
  { path: 'register', redirectTo: 'inscription' },
  { path: 'mot-de-passe-oublie', loadComponent: () => import('./pages/auth/mot-de-passe-oublie/mot-de-passe-oublie.page').then(m => m.MotDePasseOubliePage), title: 'Mot de passe oublié — WebResto' },

  // ── TOUS RÔLES ────────────────────────────────────────────────
  { path: 'profil',  canActivate: [authGuard], loadComponent: () => import('./pages/client/profil/profil.page').then(m => m.ProfilPage), title: 'Mon Profil — WebResto' },
  { path: 'profile', redirectTo: 'profil' },

  // ── CLIENT ────────────────────────────────────────────────────
  { path: 'panier',    canActivate: [authGuard, roleGuard], data: { roles: [Role.CLIENT] }, loadComponent: () => import('./pages/client/panier/panier.page').then(m => m.PanierPage), title: 'Mon Panier — WebResto' },
  { path: 'cart',      redirectTo: 'panier' },
  { path: 'commandes', canActivate: [authGuard, roleGuard], data: { roles: [Role.CLIENT] }, loadComponent: () => import('./pages/client/mes-commandes/mes-commandes.page').then(m => m.MesCommandesPage), title: 'Mes Commandes — WebResto' },

  // ── RESTAURATEUR ──────────────────────────────────────────────
  { path: 'dashboard/restaurateur', canActivate: [authGuard, roleGuard], data: { roles: [Role.RESTAURATEUR] }, loadComponent: () => import('./pages/restaurateur/tableau-de-bord/tableau-de-bord.page').then(m => m.TableauDeBordRestaurateurPage), title: 'Dashboard Restaurateur — WebResto' },

  // ── LIVREUR ───────────────────────────────────────────────────
  { path: 'dashboard/livreur', canActivate: [authGuard, roleGuard], data: { roles: [Role.LIVREUR] }, loadComponent: () => import('./pages/livreur/tableau-de-bord/tableau-de-bord.page').then(m => m.TableauDeBordLivreurPage), title: 'Dashboard Livreur — WebResto' },

  { path: '**', redirectTo: '' }
];
