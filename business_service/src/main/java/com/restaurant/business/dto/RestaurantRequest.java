package com.restaurant.business.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RestaurantRequest {
    @NotBlank public String nom;
    public String description;
    public String adresse;
    public String ville;
    public String telephone;
    public String imageUrl;
    @NotNull public Long categorieId;
}
