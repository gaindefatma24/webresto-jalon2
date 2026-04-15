package com.restaurant.auth.dto;
import com.restaurant.auth.entity.User;

public class AuthResponse {
    private String token;
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String role;
    private String telephone;
    private String adresse;

    public AuthResponse(String token, User user) {
        this.token     = token;
        this.id        = user.getId();
        this.nom       = user.getNom();
        this.prenom    = user.getPrenom();
        this.email     = user.getEmail();
        this.role      = user.getRole();
        this.telephone = user.getTelephone();
        this.adresse   = user.getAdresse();
    }

    public String getToken()     { return token; }
    public Long getId()          { return id; }
    public String getNom()       { return nom; }
    public String getPrenom()    { return prenom; }
    public String getEmail()     { return email; }
    public String getRole()      { return role; }
    public String getTelephone() { return telephone; }
    public String getAdresse()   { return adresse; }
}
