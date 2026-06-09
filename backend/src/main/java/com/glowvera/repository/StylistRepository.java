package com.glowvera.repository;

import com.glowvera.entity.Stylist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;

public interface StylistRepository extends JpaRepository<Stylist, Long> {
    Optional<Stylist> findByName(String name);
    
    // Skill-to-staff filtering query (single service)
    @Query("SELECT s FROM Stylist s JOIN s.services serv WHERE serv.id = :serviceId AND s.isActive = true")
    List<Stylist> findActiveStylistsByServiceId(@Param("serviceId") Long serviceId);

    // Filter stylists qualified for ALL selected services in the cart
    @Query("SELECT s FROM Stylist s JOIN s.services serv WHERE s.isActive = true AND serv.id IN :serviceIds " +
           "GROUP BY s.id HAVING COUNT(serv.id) = :serviceCount")
    List<Stylist> findActiveStylistsQualifiedForAllServices(
            @Param("serviceIds") List<Long> serviceIds,
            @Param("serviceCount") Long serviceCount);
}
