package com.restaurant.business.dto;

import com.restaurant.business.entity.Restaurant;

/**
 * RestaurantDto — Objet retourné au frontend Angular
 *
 * Correspond exactement au modèle Restaurant dans models/index.ts :
 * { id, nom, description, adresse, ville, telephone,
 *   categorieId, categorie, imageUrl, proprietaireId }
 */
public class RestaurantDto {

    public Long id;
    public String nom;
    public String description;
    public String adresse;
    public String ville;
    public String telephone;
    public Long categorieId;
    public String categorie;   // nom de la catégorie (dénormalisé pour Angular)
    public String imageUrl;
    public Long proprietaireId;

    /** Construit le DTO depuis l'entité JPA */
    public static RestaurantDto from(Restaurant r) {
        RestaurantDto dto = new RestaurantDto();
        dto.id             = r.getId();
        dto.nom            = r.getNom();
        dto.description    = r.getDescription();
        dto.adresse        = r.getAdresse();
        dto.ville          = r.getVille();
        dto.telephone      = r.getTelephone();
        dto.imageUrl       = r.getImageUrl();
        dto.proprietaireId = r.getProprietaireId();
        if (r.getCategorie() != null) {
            dto.categorieId = r.getCategorie().getId();
            dto.categorie   = r.getCategorie().getNom();
        }
        return dto;
    }
}
