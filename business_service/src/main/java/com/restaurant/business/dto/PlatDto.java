package com.restaurant.business.dto;

import com.restaurant.business.entity.Plat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * PlatDto — Correspond à l'interface Plat dans models/index.ts :
 * { id, nom, description, prix, imageUrl, restaurantId, disponible }
 */
public class PlatDto {

    public Long id;
    public String nom;
    public String description;
    public BigDecimal prix;
    public String imageUrl;
    public Long restaurantId;
    public boolean disponible;

    public static PlatDto from(Plat p) {
        PlatDto dto     = new PlatDto();
        dto.id          = p.getId();
        dto.nom         = p.getNom();
        dto.description = p.getDescription();
        dto.prix        = p.getPrix();
        dto.imageUrl    = p.getImageUrl();
        dto.restaurantId = p.getRestaurant().getId();
        dto.disponible  = p.isDisponible();
        return dto;
    }
}
