package com.restaurant.auth.controller;

import com.restaurant.auth.dto.*;
import com.restaurant.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.restaurant.auth.entity.User;

/**
 * AuthController — Points d'entrée REST de l'authentification
 *
 * Architecture respectée : Controller → Service → Repository
 *
 * Routes :
 *   POST /api/auth/register          -> Inscription
 *   POST /api/auth/login             -> Connexion
 *   POST /api/auth/forgot-password   -> Demander un reset
 *   POST /api/auth/reset-password    -> Valider le reset
 *   PUT  /api/auth/profile           -> Mettre à jour le profil (JWT requis)
 *   GET  /api/auth/me                -> Infos utilisateur courant (JWT requis)
 *
 * @Valid déclenche la validation des DTOs (annotations @NotBlank, @Email, etc.)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/register — Créer un nouveau compte */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    /** POST /api/auth/login — Se connecter */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /**
     * POST /api/auth/forgot-password — Demander un lien de reset
     * Retourne toujours 200 OK (même si l'email n'existe pas) pour
     * éviter l'énumération d'emails.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok().build();
    }

    /** POST /api/auth/reset-password — Réinitialiser le mot de passe avec le token */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/auth/profile — Mettre à jour le profil
     * Route protégée : JWT requis dans le header Authorization.
     * @AuthenticationPrincipal injecte l'utilisateur extrait du JWT.
     */
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest req) {
        User user = (User) userDetails;
        return ResponseEntity.ok(authService.updateProfile(user.getId(), req));
    }

    /**
     * GET /api/auth/me — Récupérer les infos de l'utilisateur courant
     * Utile pour recharger les données après un refresh de page avec un token stocké.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = (User) userDetails;
        // On retourne les infos sans générer un nouveau token
        return ResponseEntity.ok(new AuthResponse(null, user));
    }
}
