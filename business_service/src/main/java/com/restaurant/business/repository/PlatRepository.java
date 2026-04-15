package com.restaurant.business.repository;

import com.restaurant.business.entity.Plat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlatRepository extends JpaRepository<Plat, Long> {
    List<Plat> findByRestaurantId(Long restaurantId);
    List<Plat> findByRestaurantIdAndDisponibleTrue(Long restaurantId);
    void deleteByRestaurantId(Long restaurantId);
}
