package com.restaurant.business.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String adresse;
    private String ville;
    private String telephone;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    // Référence vers l'utilisateur dans auth_db
    // PAS de @ManyToOne cross-service — on stocke juste l'ID
    @Column(name = "proprietaire_id")
    private Long proprietaireId;

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    // Getters / Setters
    public Long getId()                        { return id; }
    public String getNom()                     { return nom; }
    public void setNom(String n)               { this.nom = n; }
    public String getDescription()             { return description; }
    public void setDescription(String d)       { this.description = d; }
    public String getAdresse()                 { return adresse; }
    public void setAdresse(String a)           { this.adresse = a; }
    public String getVille()                   { return ville; }
    public void setVille(String v)             { this.ville = v; }
    public String getTelephone()               { return telephone; }
    public void setTelephone(String t)         { this.telephone = t; }
    public String getImageUrl()                { return imageUrl; }
    public void setImageUrl(String u)          { this.imageUrl = u; }
    public Categorie getCategorie()            { return categorie; }
    public void setCategorie(Categorie c)      { this.categorie = c; }
    public Long getProprietaireId()            { return proprietaireId; }
    public void setProprietaireId(Long id)     { this.proprietaireId = id; }
    public boolean isActif()                   { return actif; }
    public void setActif(boolean a)            { this.actif = a; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
}
