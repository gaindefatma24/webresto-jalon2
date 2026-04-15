package com.restaurant.business.security;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

/**
 * JwtUserIdExtractor
 *
 * Utilitaire pour extraire l'ID utilisateur depuis le token JWT
 * dans les contrôleurs. L'ID est encodé dans le claim "userId"
 * ou on le récupère via l'email depuis le token.
 *
 * Note : dans notre architecture, le JWT contient l'email (subject)
 * et le rôle. L'ID utilisateur n'est PAS dans le token par défaut.
 * On utilise l'email comme identifiant dans les contrôleurs.
 *
 * Pour les routes qui ont besoin de l'ID numérique (clientId dans
 * les commandes), le frontend doit envoyer son ID dans le body
 * OU on modifie l'auth-service pour inclure l'ID dans le token.
 */
@Component
public class JwtUserIdExtractor {

    private final JwtService jwtService;

    public JwtUserIdExtractor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /** Extrait l'email (subject) depuis le token Bearer */
    public String extractEmail(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return jwtService.extractUsername(bearerToken.substring(7));
        }
        return null;
    }

    /** Extrait le rôle depuis le token Bearer */
    public String extractRole(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return jwtService.extractRole(bearerToken.substring(7));
        }
        return null;
    }

    /** Extrait l'ID utilisateur depuis le token Bearer (claim "userId") */
    public Long extractUserId(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            try {
                Object userId = jwtService.extractClaim(
                    bearerToken.substring(7),
                    claims -> claims.get("userId")
                );
                if (userId instanceof Integer) return ((Integer) userId).longValue();
                if (userId instanceof Long) return (Long) userId;
                if (userId instanceof String) return Long.parseLong((String) userId);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
