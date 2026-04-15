package com.restaurant.business.controller;

import com.restaurant.business.dto.*;
import com.restaurant.business.security.JwtUserIdExtractor;
import com.restaurant.business.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * RestaurantController — API REST pour restaurants, plats et catégories
 *
 * Routes respectant les verbes HTTP demandés :
 *
 * CATÉGORIES (publiques)
 *   GET  /api/categories
 *
 * RESTAURANTS
 *   GET    /api/restaurants                -> public
 *   GET    /api/restaurants/{id}           -> public
 *   GET    /api/restaurants/search         -> public
 *   GET    /api/restaurants/mes-restaurants -> RESTAURATEUR
 *   POST   /api/restaurants               -> RESTAURATEUR
 *   PUT    /api/restaurants/{id}          -> RESTAURATEUR (propriétaire)
 *   DELETE /api/restaurants/{id}          -> RESTAURATEUR (propriétaire)
 *
 * PLATS
 *   GET    /api/restaurants/{id}/plats    -> public
 *   GET    /api/plats/{id}               -> public
 *   POST   /api/restaurants/{id}/plats   -> RESTAURATEUR
 *   PUT    /api/plats/{id}              -> RESTAURATEUR
 *   DELETE /api/plats/{id}             -> RESTAURATEUR
 */
@RestController
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final JwtUserIdExtractor jwtExtractor;

    public RestaurantController(RestaurantService restaurantService,
                                 JwtUserIdExtractor jwtExtractor) {
        this.restaurantService = restaurantService;
        this.jwtExtractor      = jwtExtractor;
    }

    // ── CATÉGORIES ────────────────────────────────────────────────────────────

    @GetMapping("/api/categories")
    public ResponseEntity<List<CategorieDto>> getCategories() {
        return ResponseEntity.ok(restaurantService.getCategories());
    }

    // ── RESTAURANTS — LECTURE ─────────────────────────────────────────────────

    @GetMapping("/api/restaurants")
    public ResponseEntity<List<RestaurantDto>> getAll() {
        return ResponseEntity.ok(restaurantService.getAll());
    }

    @GetMapping("/api/restaurants/{id}")
    public ResponseEntity<RestaurantDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getById(id));
    }

    /** Recherche par nom et/ou catégorie : GET /api/restaurants/search?nom=pizza&categorieId=1 */
    @GetMapping("/api/restaurants/search")
    public ResponseEntity<List<RestaurantDto>> search(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) Long categorieId) {
        return ResponseEntity.ok(restaurantService.search(nom, categorieId));
    }

    /** Restaurants du restaurateur connecté (dashboard) */
    @GetMapping("/api/restaurants/mes-restaurants")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<List<RestaurantDto>> mesRestaurants(
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        return ResponseEntity.ok(restaurantService.getByProprietaire(proprietaireId));
    }

    // ── RESTAURANTS — ÉCRITURE ────────────────────────────────────────────────

    @PostMapping("/api/restaurants")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<RestaurantDto> create(
            @Valid @RequestBody RestaurantRequest req,
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(restaurantService.createRestaurant(req, proprietaireId));
    }

    @PutMapping("/api/restaurants/{id}")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<RestaurantDto> update(
            @PathVariable Long id,
            @RequestBody RestaurantRequest req,
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        return ResponseEntity.ok(restaurantService.updateRestaurant(id, req, proprietaireId));
    }

    @DeleteMapping("/api/restaurants/{id}")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        restaurantService.deleteRestaurant(id, proprietaireId);
        return ResponseEntity.noContent().build();
    }

    // ── PLATS — LECTURE ───────────────────────────────────────────────────────

    @GetMapping("/api/restaurants/{restaurantId}/plats")
    public ResponseEntity<List<PlatDto>> getPlats(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantService.getPlats(restaurantId));
    }

    @GetMapping("/api/plats/{id}")
    public ResponseEntity<PlatDto> getPlatById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getPlatById(id));
    }

    // ── PLATS — ÉCRITURE ──────────────────────────────────────────────────────

    @PostMapping("/api/restaurants/{restaurantId}/plats")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<PlatDto> createPlat(
            @PathVariable Long restaurantId,
            @Valid @RequestBody PlatRequest req,
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(restaurantService.createPlat(restaurantId, req, proprietaireId));
    }

    @PutMapping("/api/plats/{id}")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<PlatDto> updatePlat(
            @PathVariable Long id,
            @RequestBody PlatRequest req,
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        return ResponseEntity.ok(restaurantService.updatePlat(id, req, proprietaireId));
    }

    @DeleteMapping("/api/plats/{id}")
    @PreAuthorize("hasRole('RESTAURATEUR')")
    public ResponseEntity<Void> deletePlat(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Long proprietaireId = jwtExtractor.extractUserId(token);
        restaurantService.deletePlat(id, proprietaireId);
        return ResponseEntity.noContent().build();
    }
}
