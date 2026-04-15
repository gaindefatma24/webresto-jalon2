package com.restaurant.business.dto;

import com.restaurant.business.entity.Categorie;

public class CategorieDto {
    public Long id;
    public String nom;
    public String icon;

    public static CategorieDto from(Categorie c) {
        CategorieDto dto = new CategorieDto();
        dto.id   = c.getId();
        dto.nom  = c.getNom();
        dto.icon = c.getIcon();
        return dto;
    }
}
