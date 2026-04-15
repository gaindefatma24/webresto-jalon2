/**
 * ================================================================
 * jwt.interceptor.ts — Intercepteur HTTP pour le JWT
 * ================================================================
 *
 * Ce fichier est le "pont" entre Angular et les microservices.
 *
 * COMMENT ÇA FONCTIONNE :
 * Chaque fois qu'Angular fait un appel HTTP (HttpClient.get, .post...),
 * cet intercepteur s'exécute AVANT l'envoi de la requête.
 * Si un token JWT est stocké en mémoire, il l'ajoute automatiquement
 * dans le header :
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
 *
 * Sans cet intercepteur, il faudrait ajouter le header manuellement
 * dans chaque appel de service -> code dupliqué, risque d'oubli.
 *
 * NOTE : Le token est stocké dans localStorage pour persister
 * après un rechargement de page (contrairement au Jalon I en mémoire).
 * ================================================================
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/** Clé de stockage du JWT dans localStorage */
export const JWT_KEY = 'webresto_token';

/** Intercepteur fonctionnel (Angular 17+ standalone) */
export const jwtInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) => {
    const token = localStorage.getItem(JWT_KEY);

    // Si un token existe, on clone la requête en ajoutant le header Authorization
    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(authReq);
    }

    // Pas de token → requête envoyée telle quelle (routes publiques)
    return next(req);
};
