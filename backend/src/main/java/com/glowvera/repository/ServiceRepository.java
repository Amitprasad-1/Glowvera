package com.glowvera.repository;

import com.glowvera.entity.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByCategoryId(Long categoryId);
    Page<Service> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
