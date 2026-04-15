package com.restaurant.business.repository;

import com.restaurant.business.entity.Commande;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    // Commandes d'un client (pour "Mes commandes")
    List<Commande> findByClientIdOrderByCreatedAtDesc(Long clientId);

    // Commandes d'un restaurant (pour dashboard restaurateur)
    List<Commande> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    // Commandes de plusieurs restaurants (tous les restaurants d'un restaurateur)
    List<Commande> findByRestaurantIdInOrderByCreatedAtDesc(List<Long> restaurantIds);

    // Commandes disponibles pour les livreurs (EN_PREPARATION, sans livreur assigné)
    List<Commande> findByStatutAndLivreurIdIsNull(String statut);

    // Livraisons d'un livreur
    List<Commande> findByLivreurIdOrderByCreatedAtDesc(Long livreurId);
}
