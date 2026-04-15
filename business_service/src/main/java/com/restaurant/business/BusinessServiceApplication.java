package com.restaurant.business;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * BusinessServiceApplication — Point d'entrée du microservice métier
 *
 * Ce microservice tourne sur le port 8082 et gère :
 *   - Les catégories de cuisine
 *   - Les restaurants (CRUD pour les restaurateurs)
 *   - Les plats (CRUD pour les restaurateurs)
 *   - Les commandes (création, suivi, livraison)
 *
 * Toutes les routes protégées nécessitent un JWT valide
 * émis par l'auth-service (port 8081).
 *
 * Base de données : business_db (MySQL)
 * Migration : Liquibase (voir src/main/resources/db/changelog/)
 */
@SpringBootApplication
public class BusinessServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BusinessServiceApplication.class, args);
    }
}
