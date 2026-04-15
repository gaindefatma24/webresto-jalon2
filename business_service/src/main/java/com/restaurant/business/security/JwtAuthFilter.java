package com.restaurant.business.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

/**
 * JwtAuthFilter du business_service
 *
 * Différence avec l'auth-service :
 *   - On ne charge PAS l'utilisateur depuis une BD locale
 *   - On extrait l'email et le rôle directement depuis le JWT
 *   - Le token a déjà été validé lors de la connexion (auth-service)
 *
 * Les informations du JWT (email + rôle) sont injectées dans le
 * SecurityContext pour que les @PreAuthorize et les contrôleurs
 * puissent identifier qui fait la requête.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            if (jwtService.isTokenValid(jwt)) {
                String email = jwtService.extractUsername(jwt);
                String role  = jwtService.extractRole(jwt);   // ex: "RESTAURATEUR"

                // Créer l'authentification Spring Security avec le rôle extrait du JWT
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                // Stocker aussi l'ID utilisateur dans les détails pour les contrôleurs
                auth.setDetails(jwt);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            logger.warn("JWT invalide dans business_service: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
