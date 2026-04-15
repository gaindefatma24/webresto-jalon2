package com.restaurant.business.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class PlatRequest {
    @NotBlank public String nom;
    public String description;
    @NotNull @Positive public BigDecimal prix;
    public String imageUrl;
    public boolean disponible = true;
}
