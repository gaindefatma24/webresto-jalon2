package com.restaurant.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Entité User — correspond à la table "users" dans auth_db.
 *
 * Implémente UserDetails pour que Spring Security puisse charger
 * cet objet directement depuis la BD lors d'une authentification.
 *
 * Les rôles correspondent aux rôles du frontend Angular :
 *   CLIENT, RESTAURATEUR, LIVREUR
 */
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    // TOUJOURS haché BCrypt — jamais stocké en clair
    @Column(nullable = false)
    private String password;

    private String telephone;
    private String adresse;

    @Column(nullable = false)
    private String role = "CLIENT";  // CLIENT | RESTAURATEUR | LIVREUR

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    // ── UserDetails ────────────────────────────────────────────────
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
    @Override public String getUsername()               { return email; }
    @Override public boolean isAccountNonExpired()      { return true; }
    @Override public boolean isAccountNonLocked()       { return true; }
    @Override public boolean isCredentialsNonExpired()  { return true; }
    @Override public boolean isEnabled()                { return enabled; }

    // ── Getters / Setters ──────────────────────────────────────────
    public Long getId()                     { return id; }
    public String getNom()                  { return nom; }
    public void setNom(String nom)          { this.nom = nom; }
    public String getPrenom()               { return prenom; }
    public void setPrenom(String prenom)    { this.prenom = prenom; }
    public String getEmail()                { return email; }
    public void setEmail(String email)      { this.email = email; }
    public String getPassword()             { return password; }
    public void setPassword(String pw)      { this.password = pw; }
    public String getTelephone()            { return telephone; }
    public void setTelephone(String t)      { this.telephone = t; }
    public String getAdresse()              { return adresse; }
    public void setAdresse(String a)        { this.adresse = a; }
    public String getRole()                 { return role; }
    public void setRole(String role)        { this.role = role; }
    public void setEnabled(boolean e)       { this.enabled = e; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
}
