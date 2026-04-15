package com.restaurant.auth.dto;

public class UpdateProfileRequest {
    private String nom;
    private String prenom;
    private String telephone;
    private String adresse;
    public String getNom()              { return nom; }
    public void setNom(String n)        { this.nom = n; }
    public String getPrenom()           { return prenom; }
    public void setPrenom(String p)     { this.prenom = p; }
    public String getTelephone()        { return telephone; }
    public void setTelephone(String t)  { this.telephone = t; }
    public String getAdresse()          { return adresse; }
    public void setAdresse(String a)    { this.adresse = a; }
}
