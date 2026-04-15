package com.restaurant.business.repository;
import com.restaurant.business.entity.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CategorieRepository extends JpaRepository<Categorie, Long> {}
