package com.restaurant.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.util.*;
import java.util.function.Function;

/**
 * JwtService — Création et validation des tokens JWT
 *
 * Structure d'un JWT :  HEADER.PAYLOAD.SIGNATURE
 *   - Header  : algorithme utilisé (HS256)
 *   - Payload : claims (sub=email, role, iat, exp)
 *   - Signature : HMAC-SHA256(header+payload, secretKey)
 *
 * Le frontend Angular stocke ce token et l'envoie dans chaque requête :
 *   Authorization: Bearer <token>
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /** Génère un JWT pour l'utilisateur connecté */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // On inclut le rôle dans le token pour que le business_service
        // puisse vérifier les droits sans appeler l'auth-service
        claims.put("role", userDetails.getAuthorities()
                .stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("CLIENT"));
        // On inclut l'ID pour que le business_service puisse identifier
        // l'utilisateur sans accéder à auth_db
        if (userDetails instanceof com.restaurant.auth.entity.User user) {
            claims.put("userId", user.getId());
        }

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())  // email
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /** Valide le token : signature correcte ET non expiré */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    /** Extrait l'email (subject) du token */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(Jwts.parser()
                .verifyWith(getSigningKey()).build()
                .parseSignedClaims(token).getPayload());
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
