package com.restaurant.business.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class CommandeRequest {
    @NotNull public Long restaurantId;
    public String restaurantNom;
    public String clientNom;
    public String adresseLivraison;

    @NotEmpty
    public List<LigneRequest> lignes;

    public static class LigneRequest {
        public Long platId;
        public String nomPlat;
        public int quantite;
        public BigDecimal prixUnitaire;
    }
}
