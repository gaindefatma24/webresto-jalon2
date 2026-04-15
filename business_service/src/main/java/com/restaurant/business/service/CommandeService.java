package com.restaurant.business.service;

import com.restaurant.business.dto.CommandeDto;
import com.restaurant.business.dto.CommandeRequest;
import com.restaurant.business.entity.Commande;
import com.restaurant.business.entity.LigneCommande;
import com.restaurant.business.exception.BadRequestException;
import com.restaurant.business.exception.ResourceNotFoundException;
import com.restaurant.business.repository.CommandeRepository;
import com.restaurant.business.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CommandeService — Gestion du cycle de vie des commandes
 *
 * Cycle :  EN_ATTENTE → EN_PREPARATION → EN_LIVRAISON → LIVREE
 *                    ↘ ANNULEE
 *
 * Qui fait quoi :
 *   CLIENT       → crée la commande (placeOrder), voit ses commandes
 *   RESTAURATEUR → accepte (EN_PREPARATION) ou annule (ANNULEE)
 *   LIVREUR      → prend en charge (EN_LIVRAISON), confirme livraison (LIVREE)
 */
@Service
@Transactional
public class CommandeService {

    private final CommandeRepository commandeRepo;
    private final RestaurantRepository restaurantRepo;

    public CommandeService(CommandeRepository commandeRepo,
                           RestaurantRepository restaurantRepo) {
        this.commandeRepo  = commandeRepo;
        this.restaurantRepo = restaurantRepo;
    }

    // ── CRÉATION ──────────────────────────────────────────────────────────────

    /**
     * Crée une nouvelle commande depuis le panier du client.
     * clientId vient du JWT (pas du body) pour éviter la falsification.
     */
    public CommandeDto placeOrder(CommandeRequest req, Long clientId) {
        var restaurant = restaurantRepo.findById(req.restaurantId)
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant introuvable"));

        Commande commande = new Commande();
        commande.setClientId(clientId);
        commande.setClientNom(req.clientNom);
        commande.setRestaurant(restaurant);
        commande.setRestaurantNom(req.restaurantNom != null
            ? req.restaurantNom : restaurant.getNom());
        commande.setAdresseLivraison(req.adresseLivraison);
        commande.setStatut("EN_ATTENTE");

        // Construire les lignes et calculer le total
        BigDecimal total = BigDecimal.ZERO;
        for (CommandeRequest.LigneRequest lr : req.lignes) {
            LigneCommande ligne = new LigneCommande();
            ligne.setCommande(commande);
            ligne.setPlatId(lr.platId);
            ligne.setNomPlat(lr.nomPlat);
            ligne.setQuantite(lr.quantite);
            ligne.setPrixUnitaire(lr.prixUnitaire);
            BigDecimal sousTotal = lr.prixUnitaire
                .multiply(BigDecimal.valueOf(lr.quantite));
            ligne.setSousTotal(sousTotal);
            commande.getLignes().add(ligne);
            total = total.add(sousTotal);
        }
        commande.setTotal(total);

        return CommandeDto.from(commandeRepo.save(commande));
    }

    // ── LECTURE ───────────────────────────────────────────────────────────────

    /** Commandes du client connecté */
    public List<CommandeDto> getMesCommandes(Long clientId) {
        return commandeRepo.findByClientIdOrderByCreatedAtDesc(clientId)
            .stream().map(CommandeDto::from).collect(Collectors.toList());
    }

    /** Commandes d'un restaurant (dashboard restaurateur) */
    public List<CommandeDto> getCommandesRestaurant(Long restaurantId) {
        return commandeRepo.findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
            .stream().map(CommandeDto::from).collect(Collectors.toList());
    }

    /** Toutes les commandes des restaurants d'un restaurateur */
    public List<CommandeDto> getCommandesPourRestaurateur(List<Long> restaurantIds) {
        return commandeRepo.findByRestaurantIdInOrderByCreatedAtDesc(restaurantIds)
            .stream().map(CommandeDto::from).collect(Collectors.toList());
    }

    /**
     * Commandes disponibles pour les livreurs :
     * statut = EN_PREPARATION et aucun livreur assigné
     */
    public List<CommandeDto> getCommandesDisponibles() {
        return commandeRepo.findByStatutAndLivreurIdIsNull("EN_PREPARATION")
            .stream().map(CommandeDto::from).collect(Collectors.toList());
    }

    /** Livraisons d'un livreur spécifique */
    public List<CommandeDto> getMesLivraisons(Long livreurId) {
        return commandeRepo.findByLivreurIdOrderByCreatedAtDesc(livreurId)
            .stream().map(CommandeDto::from).collect(Collectors.toList());
    }

    // ── MISE À JOUR DU STATUT ─────────────────────────────────────────────────

    /** Restaurateur : accepte la commande (EN_ATTENTE → EN_PREPARATION) */
    public CommandeDto accepterCommande(Long id) {
        return changerStatut(id, "EN_ATTENTE", "EN_PREPARATION");
    }

    /** Restaurateur ou client : annule la commande */
    public CommandeDto annulerCommande(Long id) {
        Commande c = findOrThrow(id);
        if ("LIVREE".equals(c.getStatut())) {
            throw new BadRequestException("Impossible d'annuler une commande déjà livrée");
        }
        c.setStatut("ANNULEE");
        return CommandeDto.from(commandeRepo.save(c));
    }

    /** Livreur : prend en charge la commande (EN_PREPARATION → EN_LIVRAISON) */
    public CommandeDto prendreEnCharge(Long id, Long livreurId, String livreurNom) {
        Commande c = findOrThrow(id);
        if (!"EN_PREPARATION".equals(c.getStatut())) {
            throw new BadRequestException("Cette commande n'est pas prête pour la livraison");
        }
        if (c.getLivreurId() != null) {
            throw new BadRequestException("Cette commande a déjà un livreur assigné");
        }
        c.setStatut("EN_LIVRAISON");
        c.setLivreurId(livreurId);
        c.setLivreurNom(livreurNom);
        return CommandeDto.from(commandeRepo.save(c));
    }

    /** Livreur : confirme la livraison (EN_LIVRAISON → LIVREE) */
    public CommandeDto confirmerLivraison(Long id, Long livreurId) {
        Commande c = findOrThrow(id);
        if (!livreurId.equals(c.getLivreurId())) {
            throw new BadRequestException("Vous n'êtes pas le livreur de cette commande");
        }
        c.setStatut("LIVREE");
        return CommandeDto.from(commandeRepo.save(c));
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private Commande findOrThrow(Long id) {
        return commandeRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable"));
    }

    private CommandeDto changerStatut(Long id, String statutAttendu, String nouveauStatut) {
        Commande c = findOrThrow(id);
        if (!statutAttendu.equals(c.getStatut())) {
            throw new BadRequestException(
                "Statut invalide. Attendu: " + statutAttendu + ", actuel: " + c.getStatut());
        }
        c.setStatut(nouveauStatut);
        return CommandeDto.from(commandeRepo.save(c));
    }
}
