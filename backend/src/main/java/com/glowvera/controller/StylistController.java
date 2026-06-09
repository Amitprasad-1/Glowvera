package com.glowvera.controller;

import com.glowvera.entity.Service;
import com.glowvera.entity.Stylist;
import com.glowvera.repository.ServiceRepository;
import com.glowvera.repository.StylistRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class StylistController {

    private final StylistRepository stylistRepository;
    private final ServiceRepository serviceRepository;

    public StylistController(StylistRepository stylistRepository, ServiceRepository serviceRepository) {
        this.stylistRepository = stylistRepository;
        this.serviceRepository = serviceRepository;
    }

    // Public: Get all stylists (clients/admins)
    @GetMapping("/stylists")
    public ResponseEntity<List<Stylist>> getAllStylists() {
        return ResponseEntity.ok(stylistRepository.findAll());
    }

    // Public: Filter stylists qualified for ALL selected services in the cart
    @GetMapping("/stylists/filter")
    public ResponseEntity<List<Stylist>> getFilteredStylists(@RequestParam List<Long> serviceIds) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            // If no services selected, return all active stylists
            return ResponseEntity.ok(
                stylistRepository.findAll().stream().filter(Stylist::getIsActive).collect(Collectors.toList())
            );
        }
        long serviceCount = serviceIds.size();
        return ResponseEntity.ok(stylistRepository.findActiveStylistsQualifiedForAllServices(serviceIds, serviceCount));
    }

    // Admin: Add new stylist
    @PostMapping("/admin/stylists")
    public ResponseEntity<Stylist> addStylist(@RequestBody Stylist stylist) {
        if (stylist.getIsActive() == null) {
            stylist.setIsActive(true);
        }
        if (stylist.getServices() == null) {
            stylist.setServices(new HashSet<>());
        }
        return ResponseEntity.ok(stylistRepository.save(stylist));
    }

    // Admin: Update stylist (details, status, working hours, break hours)
    @PutMapping("/admin/stylists/{id}")
    public ResponseEntity<Stylist> updateStylist(@PathVariable Long id, @RequestBody Stylist updatedStylist) {
        Stylist stylist = stylistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Stylist not found"));

        stylist.setName(updatedStylist.getName());
        stylist.setIsActive(updatedStylist.getIsActive());
        stylist.setWorkingStart(updatedStylist.getWorkingStart());
        stylist.setWorkingEnd(updatedStylist.getWorkingEnd());
        stylist.setBreakStart(updatedStylist.getBreakStart());
        stylist.setBreakEnd(updatedStylist.getBreakEnd());

        if (updatedStylist.getServices() != null) {
            Set<Service> serviceSet = new HashSet<>();
            for (Service s : updatedStylist.getServices()) {
                serviceRepository.findById(s.getId()).ifPresent(serviceSet::add);
            }
            stylist.setServices(serviceSet);
        }

        return ResponseEntity.ok(stylistRepository.save(stylist));
    }

    // Admin: Delete stylist
    @DeleteMapping("/admin/stylists/{id}")
    public ResponseEntity<Void> deleteStylist(@PathVariable Long id) {
        if (!stylistRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        stylistRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
