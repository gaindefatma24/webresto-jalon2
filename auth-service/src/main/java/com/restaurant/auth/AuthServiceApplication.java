package com.restaurant.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AuthServiceApplication — Point d'entrée du microservice d'authentification
 *
 * Ce microservice tourne sur le port 8081 et gère :
 *   - L'inscription des utilisateurs
 *   - La connexion avec génération de JWT
 *   - La réinitialisation de mot de passe par email
 *   - La mise à jour du profil
 *
 * Base de données : auth_db (MySQL)
 * Migration : Liquibase (voir src/main/resources/db/changelog/)
 */
@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
