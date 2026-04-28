package com.restaurant.auth.service;

import com.restaurant.auth.dto.*;
import com.restaurant.auth.entity.PasswordResetToken;
import com.restaurant.auth.entity.User;
import com.restaurant.auth.exception.BadRequestException;
import com.restaurant.auth.exception.ResourceNotFoundException;
import com.restaurant.auth.repository.PasswordResetTokenRepository;
import com.restaurant.auth.repository.UserRepository;
import com.restaurant.auth.security.JwtService;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * AuthService — Logique métier de l'authentification
 *
 * Respecte l'architecture : Controller → Service → Repository
 *
 * Méthodes :
 *   register()         -> Créer un compte (hash BCrypt du mot de passe)
 *   login()            -> Connexion, retourne un JWT
 *   forgotPassword()   -> Génère un token de reset et l'envoie par email
 *   resetPassword()    -> Valide le token et change le mot de passe
 *   updateProfile()    -> Met à jour les infos non-sensibles du profil
 */
@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final JavaMailSender mailSender;

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authManager,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
        this.mailSender = mailSender;
    }

    // ── INSCRIPTION ──────────────────────────────────────────────────────────

    /**
     * Crée un nouveau compte utilisateur.
     *
     * Étapes :
     *  1. Vérifier que l'email n'est pas déjà utilisé
     *  2. Hacher le mot de passe avec BCrypt
     *  3. Sauvegarder l'utilisateur en BD
     *  4. Générer et retourner un JWT
     */
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Cet email est déjà utilisé");
        }

        // Valider le rôle (uniquement CLIENT ou RESTAURATEUR à l'inscription)
        String role = req.getRole();
        if (role == null || (!role.equals("CLIENT") && !role.equals("RESTAURATEUR") && !role.equals("LIVREUR"))) {
            role = "CLIENT";
        }

        User user = new User();
        user.setNom(req.getNom());
        user.setPrenom(req.getPrenom());
        user.setEmail(req.getEmail().toLowerCase());
        // IMPORTANT : toujours hacher avec BCrypt — jamais stocker en clair
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setTelephone(req.getTelephone());
        user.setAdresse(req.getAdresse());
        user.setRole(role);

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return new AuthResponse(token, saved);
    }

    // ── CONNEXION ────────────────────────────────────────────────────────────

    /**
     * Connecte un utilisateur existant.
     *
     * authManager.authenticate() :
     *   - Charge l'utilisateur via UserDetailsService (email)
     *   - Vérifie le mot de passe avec BCrypt
     *   - Lance BadCredentialsException si échec
     */
    public AuthResponse login(LoginRequest req) {
        // Spring Security gère la vérification du mot de passe
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                req.getEmail().toLowerCase(),
                req.getPassword()
            )
        );

        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user);
    }

    // ── RECOUVREMENT MOT DE PASSE ─────────────────────────────────────────────

    /**
     * Étape 1 — L'utilisateur fournit son email.
     * On génère un UUID unique, on l'enregistre en BD (expire dans 1h),
     * et on envoie un lien par email.
     *
     * SÉCURITÉ : on retourne toujours un message générique, même si l'email
     * n'existe pas -> évite l'énumération d'emails (user enumeration attack).
     */
    public void forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.getEmail().toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            tokenRepository.save(new PasswordResetToken(token, user));
            sendResetEmail(user.getEmail(), token);
        });
        // Pas d'exception si email inexistant → sécurité
    }

    /**
     * Étape 2 — L'utilisateur entre son nouveau mot de passe avec le token reçu.
     *
     * Validations :
     *   - Token existe en BD
     *   - Token non expiré (< 1h)
     *   - Token non déjà utilisé
     */
    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken prt = tokenRepository.findByToken(req.getToken())
            .orElseThrow(() -> new BadRequestException("Token invalide"));

        if (prt.isExpired()) {
            throw new BadRequestException("Ce lien de réinitialisation a expiré");
        }
        if (prt.isUsed()) {
            throw new BadRequestException("Ce lien a déjà été utilisé");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        prt.setUsed(true);
        tokenRepository.save(prt);
    }

    // ── MISE À JOUR PROFIL ────────────────────────────────────────────────────

    public AuthResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        if (req.getNom()       != null) user.setNom(req.getNom());
        if (req.getPrenom()    != null) user.setPrenom(req.getPrenom());
        if (req.getTelephone() != null) user.setTelephone(req.getTelephone());
        if (req.getAdresse()   != null) user.setAdresse(req.getAdresse());

        User saved = userRepository.save(user);
        // Re-génère un token avec les nouvelles infos
        return new AuthResponse(jwtService.generateToken(saved), saved);
    }

    // ── MÉTHODE PRIVÉE ────────────────────────────────────────────────────────

    private void sendResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("WebResto — Réinitialisation de votre mot de passe");
        message.setText(
            "Bonjour,\n\n" +
            "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
            "Cliquez sur le lien suivant (valide 15 minutes) :\n" +
            "http://localhost:4200/reset-password?token=" + token + "\n\n" +
            "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n" +
            "L'équipe WebResto"
        );
        mailSender.send(message);
    }
}
