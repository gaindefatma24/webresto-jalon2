package com.restaurant.business.dto;

import com.restaurant.business.entity.Commande;
import com.restaurant.business.entity.LigneCommande;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CommandeDto — Correspond à l'interface Commande dans models/index.ts :
 * { id, clientId, clientNom, restaurantId, restaurantNom,
 *   lignes[], statut, adresseLivraison, total, date, livreurId, livreurNom }
 */
public class CommandeDto {

    public Long id;
    public Long clientId;
    public String clientNom;
    public Long restaurantId;
    public String restaurantNom;
    public List<LigneDto> lignes;
    public String statut;
    public String adresseLivraison;
    public BigDecimal total;
    public String date;
    public Long livreurId;
    public String livreurNom;

    public static CommandeDto from(Commande c) {
        CommandeDto dto        = new CommandeDto();
        dto.id                 = c.getId();
        dto.clientId           = c.getClientId();
        dto.clientNom          = c.getClientNom();
        dto.restaurantId       = c.getRestaurant().getId();
        dto.restaurantNom      = c.getRestaurantNom();
        dto.statut             = c.getStatut();
        dto.adresseLivraison   = c.getAdresseLivraison();
        dto.total              = c.getTotal();
        dto.livreurId          = c.getLivreurId();
        dto.livreurNom         = c.getLivreurNom();
        // Format date identique au frontend mock : "2025-02-10 18:34"
        dto.date = c.getCreatedAt() != null
            ? c.getCreatedAt().toString().replace("T", " ").substring(0, 16)
            : "";
        dto.lignes = c.getLignes().stream()
            .map(LigneDto::from).collect(Collectors.toList());
        return dto;
    }

    // Classe interne pour les lignes de commande
    public static class LigneDto {
        public Long platId;
        public String nomPlat;
        public int quantite;
        public BigDecimal prixUnitaire;
        public BigDecimal sousTotal;

        public static LigneDto from(LigneCommande l) {
            LigneDto d       = new LigneDto();
            d.platId         = l.getPlatId();
            d.nomPlat        = l.getNomPlat();
            d.quantite       = l.getQuantite();
            d.prixUnitaire   = l.getPrixUnitaire();
            d.sousTotal      = l.getSousTotal();
            return d;
        }
    }
}
