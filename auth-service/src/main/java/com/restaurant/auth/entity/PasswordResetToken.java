package com.restaurant.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private boolean used = false;

    public PasswordResetToken() {}

    public PasswordResetToken(String token, User user) {
        this.token = token;
        this.user = user;
        this.expiryDate = LocalDateTime.now().plusMinutes(15); // Expire dans 15 minutes
    }

    public boolean isExpired() { return LocalDateTime.now().isAfter(expiryDate); }

    public Long getId()                    { return id; }
    public String getToken()               { return token; }
    public User getUser()                  { return user; }
    public LocalDateTime getExpiryDate()   { return expiryDate; }
    public boolean isUsed()               { return used; }
    public void setUsed(boolean used)     { this.used = used; }
}
