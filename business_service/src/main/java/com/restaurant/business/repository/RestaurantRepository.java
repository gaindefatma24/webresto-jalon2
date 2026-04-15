package com.restaurant.business.repository;

import com.restaurant.business.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByActifTrue();

    List<Restaurant> findByProprietaireId(Long proprietaireId);

    List<Restaurant> findByCategorieIdAndActifTrue(Long categorieId);

    List<Restaurant> findByNomContainingIgnoreCaseAndActifTrue(String nom);

    // Recherche combinée nom + catégorie
    @Query("SELECT r FROM Restaurant r WHERE r.actif = true " +
           "AND (:nom IS NULL OR LOWER(r.nom) LIKE LOWER(CONCAT('%', :nom, '%'))) " +
           "AND (:categorieId IS NULL OR r.categorie.id = :categorieId)")
    List<Restaurant> search(@Param("nom") String nom, @Param("categorieId") Long categorieId);
}
