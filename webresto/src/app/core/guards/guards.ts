/**
 * ================================================================
 * Guards — Protection des routes Angular
 * ================================================================
 *
 * Les guards sont des fonctions qui s'exécutent AVANT le chargement
 * d'un composant. Ils décident si la navigation peut continuer.
 * ================================================================
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

/**
 * authGuard — Vérifie que l'utilisateur est connecté.
 * Si non connecté → redirection vers /login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true; // Accès autorisé
  }

  // Redirige vers login en gardant l'URL cible pour redirection post-login
  console.log(`[AuthGuard] Accès refusé à "${state.url}" — utilisateur non connecté`);
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * roleGuard — Vérifie que l'utilisateur a le bon rôle.
 * Les rôles autorisés sont définis dans route.data.roles
 * Si mauvais rôle → redirection vers la page d'accueil
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Récupère les rôles autorisés depuis la configuration de la route
  const roles = route.data['roles'] as Role[];

  if (auth.hasRole(roles)) {
    return true; // Rôle autorisé
  }

  console.log(`[RoleGuard] Rôle insuffisant pour "${state.url}"`);
  return router.createUrlTree(['/']); // Retour à l'accueil
};
