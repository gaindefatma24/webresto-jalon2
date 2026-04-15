package com.restaurant.business.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Categorie {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    private String icon;

    public Long getId()             { return id; }
    public String getNom()          { return nom; }
    public void setNom(String n)    { this.nom = n; }
    public String getIcon()         { return icon; }
    public void setIcon(String i)   { this.icon = i; }
}
