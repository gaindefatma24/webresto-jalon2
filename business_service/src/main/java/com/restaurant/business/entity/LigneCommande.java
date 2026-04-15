package com.restaurant.business.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lignes_commande")
public class LigneCommande {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    @Column(name = "plat_id")
    private Long platId;

    @Column(name = "nom_plat")
    private String nomPlat;

    private int quantite = 1;

    // Prix figé au moment de la commande
    @Column(name = "prix_unitaire", precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(name = "sous_total", precision = 10, scale = 2)
    private BigDecimal sousTotal;

    public Long getId()                        { return id; }
    public Commande getCommande()              { return commande; }
    public void setCommande(Commande c)        { this.commande = c; }
    public Long getPlatId()                    { return platId; }
    public void setPlatId(Long id)             { this.platId = id; }
    public String getNomPlat()                 { return nomPlat; }
    public void setNomPlat(String n)           { this.nomPlat = n; }
    public int getQuantite()                   { return quantite; }
    public void setQuantite(int q)             { this.quantite = q; }
    public BigDecimal getPrixUnitaire()        { return prixUnitaire; }
    public void setPrixUnitaire(BigDecimal p)  { this.prixUnitaire = p; }
    public BigDecimal getSousTotal()           { return sousTotal; }
    public void setSousTotal(BigDecimal s)     { this.sousTotal = s; }
}
