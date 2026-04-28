package com.restaurant.business.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "plats")
public class Plat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prix;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false)
    private boolean disponible = true;

    // Getters / Setters
    public Long getId()                      { return id; }
    public String getNom()                   { return nom; }
    public void setNom(String n)             { this.nom = n; }
    public String getDescription()           { return description; }
    public void setDescription(String d)     { this.description = d; }
    public BigDecimal getPrix()              { return prix; }
    public void setPrix(BigDecimal p)        { this.prix = p; }
    public String getImageUrl()              { return imageUrl; }
    public void setImageUrl(String u)        { this.imageUrl = u; }
    public Restaurant getRestaurant()        { return restaurant; }
    public void setRestaurant(Restaurant r)  { this.restaurant = r; }
    public boolean isDisponible()            { return disponible; }
    public void setDisponible(boolean d)     { this.disponible = d; }
}
