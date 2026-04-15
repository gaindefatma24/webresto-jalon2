package com.restaurant.business.service;

import com.restaurant.business.dto.*;
import com.restaurant.business.entity.*;
import com.restaurant.business.exception.BadRequestException;
import com.restaurant.business.exception.ResourceNotFoundException;
import com.restaurant.business.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * RestaurantService — Logique métier pour restaurants, plats et catégories
 *
 * Architecture : Controller → Service → Repository
 */
@Service
@Transactional
public class RestaurantService {

    private final RestaurantRepository restaurantRepo;
    private final PlatRepository platRepo;
    private final CategorieRepository categorieRepo;

    public RestaurantService(RestaurantRepository restaurantRepo,
                             PlatRepository platRepo,
                             CategorieRepository categorieRepo) {
        this.restaurantRepo = restaurantRepo;
        this.platRepo       = platRepo;
        this.categorieRepo  = categorieRepo;
    }

    // ── CATÉGORIES ────────────────────────────────────────────────────────────

    public List<CategorieDto> getCategories() {
        return categorieRepo.findAll().stream()
            .map(CategorieDto::from).collect(Collectors.toList());
    }

    // ── RESTAURANTS — LECTURE ─────────────────────────────────────────────────

    public List<RestaurantDto> getAll() {
        return restaurantRepo.findByActifTrue().stream()
            .map(RestaurantDto::from).collect(Collectors.toList());
    }

    public RestaurantDto getById(Long id) {
        return RestaurantDto.from(findRestaurantOrThrow(id));
    }

    public List<RestaurantDto> getByProprietaire(Long proprietaireId) {
        return restaurantRepo.findByProprietaireId(proprietaireId).stream()
            .map(RestaurantDto::from).collect(Collectors.toList());
    }

    /** Recherche par nom et/ou catégorie — utilisée par la page liste Angular */
    public List<RestaurantDto> search(String nom, Long categorieId) {
        return restaurantRepo.search(
            (nom != null && !nom.isBlank()) ? nom : null,
            categorieId
        ).stream().map(RestaurantDto::from).collect(Collectors.toList());
    }

    // ── RESTAURANTS — ÉCRITURE ────────────────────────────────────────────────

    /** Crée un restaurant. proprietaireId vient du JWT (pas du body) */
    public RestaurantDto createRestaurant(RestaurantRequest req, Long proprietaireId) {
        Categorie categorie = categorieRepo.findById(req.categorieId)
            .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable"));

        Restaurant r = new Restaurant();
        r.setNom(req.nom);
        r.setDescription(req.description);
        r.setAdresse(req.adresse);
        r.setVille(req.ville);
        r.setTelephone(req.telephone);
        r.setImageUrl(req.imageUrl);
        r.setCategorie(categorie);
        r.setProprietaireId(proprietaireId);

        return RestaurantDto.from(restaurantRepo.save(r));
    }

    public RestaurantDto updateRestaurant(Long id, RestaurantRequest req, Long proprietaireId) {
        Restaurant r = findRestaurantOrThrow(id);
        checkOwnership(r, proprietaireId);

        if (req.nom         != null) r.setNom(req.nom);
        if (req.description != null) r.setDescription(req.description);
        if (req.adresse     != null) r.setAdresse(req.adresse);
        if (req.ville       != null) r.setVille(req.ville);
        if (req.telephone   != null) r.setTelephone(req.telephone);
        if (req.imageUrl    != null) r.setImageUrl(req.imageUrl);
        if (req.categorieId != null) {
            Categorie cat = categorieRepo.findById(req.categorieId)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable"));
            r.setCategorie(cat);
        }
        return RestaurantDto.from(restaurantRepo.save(r));
    }

    /** Supprime le restaurant ET tous ses plats (cascade) */
    public void deleteRestaurant(Long id, Long proprietaireId) {
        Restaurant r = findRestaurantOrThrow(id);
        checkOwnership(r, proprietaireId);
        platRepo.deleteByRestaurantId(id);
        restaurantRepo.delete(r);
    }

    // ── PLATS — LECTURE ───────────────────────────────────────────────────────

    public List<PlatDto> getPlats(Long restaurantId) {
        findRestaurantOrThrow(restaurantId); // vérifie que le restaurant existe
        return platRepo.findByRestaurantId(restaurantId).stream()
            .map(PlatDto::from).collect(Collectors.toList());
    }

    public PlatDto getPlatById(Long id) {
        return PlatDto.from(platRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Plat introuvable")));
    }

    // ── PLATS — ÉCRITURE ──────────────────────────────────────────────────────

    public PlatDto createPlat(Long restaurantId, PlatRequest req, Long proprietaireId) {
        Restaurant r = findRestaurantOrThrow(restaurantId);
        checkOwnership(r, proprietaireId);

        Plat p = new Plat();
        p.setNom(req.nom);
        p.setDescription(req.description);
        p.setPrix(req.prix);
        p.setImageUrl(req.imageUrl);
        p.setDisponible(req.disponible);
        p.setRestaurant(r);

        return PlatDto.from(platRepo.save(p));
    }

    public PlatDto updatePlat(Long platId, PlatRequest req, Long proprietaireId) {
        Plat p = platRepo.findById(platId)
            .orElseThrow(() -> new ResourceNotFoundException("Plat introuvable"));
        checkOwnership(p.getRestaurant(), proprietaireId);

        if (req.nom         != null) p.setNom(req.nom);
        if (req.description != null) p.setDescription(req.description);
        if (req.prix        != null) p.setPrix(req.prix);
        if (req.imageUrl    != null) p.setImageUrl(req.imageUrl);
        p.setDisponible(req.disponible);

        return PlatDto.from(platRepo.save(p));
    }

    public void deletePlat(Long platId, Long proprietaireId) {
        Plat p = platRepo.findById(platId)
            .orElseThrow(() -> new ResourceNotFoundException("Plat introuvable"));
        checkOwnership(p.getRestaurant(), proprietaireId);
        platRepo.delete(p);
    }

    // ── HELPERS PRIVÉS ────────────────────────────────────────────────────────

    private Restaurant findRestaurantOrThrow(Long id) {
        return restaurantRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant introuvable"));
    }

    /** Vérifie que le restaurateur connecté est bien le propriétaire */
    private void checkOwnership(Restaurant r, Long proprietaireId) {
        if (!r.getProprietaireId().equals(proprietaireId)) {
            throw new BadRequestException("Accès refusé : vous n'êtes pas le propriétaire de ce restaurant");
        }
    }
}
