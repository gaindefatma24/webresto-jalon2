package com.restaurant.auth.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 6) private String password;
    private String telephone;
    private String adresse;
    private String role = "CLIENT";

    public String getNom()              { return nom; }
    public void setNom(String n)        { this.nom = n; }
    public String getPrenom()           { return prenom; }
    public void setPrenom(String p)     { this.prenom = p; }
    public String getEmail()            { return email; }
    public void setEmail(String e)      { this.email = e; }
    public String getPassword()         { return password; }
    public void setPassword(String p)   { this.password = p; }
    public String getTelephone()        { return telephone; }
    public void setTelephone(String t)  { this.telephone = t; }
    public String getAdresse()          { return adresse; }
    public void setAdresse(String a)    { this.adresse = a; }
    public String getRole()             { return role; }
    public void setRole(String r)       { this.role = r; }
}
