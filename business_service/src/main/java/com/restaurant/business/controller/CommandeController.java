package com.restaurant.business.controller;

import com.restaurant.business.dto.CommandeDto;
import com.restaurant.business.dto.CommandeRequest;
import com.restaurant.business.security.JwtUserIdExtractor;
import com.restaurant.business.service.CommandeService;
import com.restaurant.business.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * CommandeController — API REST pour les commandes
 *
 * Routes :
 *   POST   /api/commandes                           -> CLIENT (créer commande)
 *   GET    /api/commandes/mes-commandes             -> CLIENT (ses commandes)
 *   GET    /api/commandes/disponibles               -> LIVREUR (à prendre en charge)
 *   GET    /api/commandes/mes-livraisons            -> LIVREUR
 *   GET    /api/commandes/restaurant/{id}           -> RESTAURATEUR
 *   PATCH  /api/commandes/{id}/accepter             -> RESTAURATEUR
 *   PATCH  /api/commandes/{id}/annuler              -> RESTAURATEUR | CLIENT
 *   PATCH  /api/commandes/{id}/prendre-en-charge    -> LIVREUR
 *   PATCH  /api/commandes/{id}/livrer               -> LIVREUR
 */
@RestController
@RequestMapping("/api/commandes")
public class CommandeController {

    private final CommandeService commandeService;
    private final RestaurantService restaurantService;
    private final JwtUserIdExtractor jwtExtractor;

    public CommandeController(CommandeService commandeService,
                               RestaurantService restaurantService,
                               JwtUserIdExtractor jwtExtractor) {
        this.commandeService   = commandeService;
        this.restaurantService = restaurantService;
        this.jwtExtractor      = jwtExtractor;
    }

    // ── CLIENT ────────────────────────────────────────────────────────────────

    /** POST /api/commandes — Passer une commande depuis le panier */
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<CommandeDto> placeOrder(
            @Valid @RequestBody CommandeRequest req,
            @RequestHeader("Authorization") String token) {
        Long clientId = jwtExtractor.extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commandeService.placeOrder(req, clientId));
    }

    /** GET /api/commandes/mes-commandes — Historique du client */
    @GetMapping("/mes-commandes")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<CommandeDto>> mesCommandes(
            @RequestHeader("Authorization") String token) {
        Long clientId = jwtExtractor.extractUserId(token);
        return ResponseEntity.ok(commandeService.getMesCommandes(clientId));
    }

    // ── RESTAURATEUR ──────────────────────────────────────────────────────────

    /** GET /api/commandes/restaurant/{restaurantId} — Commandes d'un restaurant */
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<List<CommandeDto>> getCommandesRestaurant(
            @PathVariable Long restaurantId) {
        return ResponseEntity.ok(commandeService.getCommandesRestaurant(restaurantId));
    }

    /**
     * GET /api/commandes/mes-restaurants-commandes
     * Toutes les commandes des restaurants du restaurateur connecté
     */
    @GetMapping("/mes-restaurants-commandes")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<List<CommandeDto>> getCommandesPourRestaurateur(
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        List<Long> restaurantIds = restaurantService
            .getByProprietaire(proprietaireId)
            .stream()
            .map(r -> r.id)
            .collect(Collectors.toList());
        return ResponseEntity.ok(commandeService.getCommandesPourRestaurateur(restaurantIds));
    }

    /** PATCH /api/commandes/{id}/accepter — EN_ATTENTE -> EN_PREPARATION */
    @PatchMapping("/{id}/accepter")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<CommandeDto> accepter(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.accepterCommande(id));
    }

    /** PATCH /api/commandes/{id}/annuler */
    @PatchMapping("/{id}/annuler")
    public ResponseEntity<CommandeDto> annuler(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.annulerCommande(id));
    }

    // ── LIVREUR ───────────────────────────────────────────────────────────────

    /** GET /api/commandes/disponibles — Commandes EN_PREPARATION sans livreur */
    @GetMapping("/disponibles")
    @PreAuthorize("hasRole('LIVREUR')")
    public ResponseEntity<List<CommandeDto>> disponibles() {
        return ResponseEntity.ok(commandeService.getCommandesDisponibles());
    }

    /** GET /api/commandes/mes-livraisons */
    @GetMapping("/mes-livraisons")
    @PreAuthorize("hasRole('LIVREUR')")
    public ResponseEntity<List<CommandeDto>> mesLivraisons(
            @RequestHeader("Authorization") String token) {
        Long livreurId = jwtExtractor.extractUserId(token);
        return ResponseEntity.ok(commandeService.getMesLivraisons(livreurId));
    }

    /**
     * PATCH /api/commandes/{id}/prendre-en-charge
     * Body : { "livreurNom": "Jean Bouchard" }
     */
    @PatchMapping("/{id}/prendre-en-charge")
    @PreAuthorize("hasRole('LIVREUR')")
    public ResponseEntity<CommandeDto> prendreEnCharge(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String token) {
        Long livreurId   = jwtExtractor.extractUserId(token);
        String livreurNom = body.getOrDefault("livreurNom", "");
        return ResponseEntity.ok(commandeService.prendreEnCharge(id, livreurId, livreurNom));
    }

    /** PATCH /api/commandes/{id}/livrer — EN_LIVRAISON -> LIVREE */
    @PatchMapping("/{id}/livrer")
    @PreAuthorize("hasRole('LIVREUR')")
    public ResponseEntity<CommandeDto> livrer(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Long livreurId = jwtExtractor.extractUserId(token);
        return ResponseEntity.ok(commandeService.confirmerLivraison(id, livreurId));
    }
}
