package com.restaurant.business.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commandes")
public class Commande {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // IDs cross-service : l'user existe dans auth_db, pas de FK possible
    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "client_nom")
    private String clientNom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "restaurant_nom")
    private String restaurantNom;

    // CascadeType.ALL : les lignes sont créées/supprimées avec la commande
    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommande> lignes = new ArrayList<>();

    @Column(nullable = false)
    private String statut = "EN_ATTENTE"; // EN_ATTENTE | EN_PREPARATION | EN_LIVRAISON | LIVREE | ANNULEE

    @Column(name = "adresse_livraison")
    private String adresseLivraison;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "livreur_id")
    private Long livreurId;

    @Column(name = "livreur_nom")
    private String livreurNom;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Long getId()                        { return id; }
    public Long getClientId()                  { return clientId; }
    public void setClientId(Long id)           { this.clientId = id; }
    public String getClientNom()               { return clientNom; }
    public void setClientNom(String n)         { this.clientNom = n; }
    public Restaurant getRestaurant()          { return restaurant; }
    public void setRestaurant(Restaurant r)    { this.restaurant = r; }
    public String getRestaurantNom()           { return restaurantNom; }
    public void setRestaurantNom(String n)     { this.restaurantNom = n; }
    public List<LigneCommande> getLignes()     { return lignes; }
    public void setLignes(List<LigneCommande> l) { this.lignes = l; }
    public String getStatut()                  { return statut; }
    public void setStatut(String s)            { this.statut = s; }
    public String getAdresseLivraison()        { return adresseLivraison; }
    public void setAdresseLivraison(String a)  { this.adresseLivraison = a; }
    public BigDecimal getTotal()               { return total; }
    public void setTotal(BigDecimal t)         { this.total = t; }
    public Long getLivreurId()                 { return livreurId; }
    public void setLivreurId(Long id)          { this.livreurId = id; }
    public String getLivreurNom()              { return livreurNom; }
    public void setLivreurNom(String n)        { this.livreurNom = n; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
}
