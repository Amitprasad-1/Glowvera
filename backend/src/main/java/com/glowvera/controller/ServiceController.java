package com.glowvera.controller;

import com.glowvera.entity.Category;
import com.glowvera.entity.Service;
import com.glowvera.repository.CategoryRepository;
import com.glowvera.repository.ServiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ServiceController {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;

    public ServiceController(ServiceRepository serviceRepository, CategoryRepository categoryRepository) {
        this.serviceRepository = serviceRepository;
        this.categoryRepository = categoryRepository;
    }

    // Public: Fetch all categories
    @GetMapping("/services/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    // Public: Fetch services, optionally paginated and filtered by search query
    @GetMapping("/services")
    public ResponseEntity<Page<Service>> getServices(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        if (search.isEmpty()) {
            return ResponseEntity.ok(serviceRepository.findAll(pageable));
        } else {
            return ResponseEntity.ok(serviceRepository.findByNameContainingIgnoreCase(search, pageable));
        }
    }

    // Public: Fetch services by category
    @GetMapping("/services/category/{categoryId}")
    public ResponseEntity<List<Service>> getServicesByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(serviceRepository.findByCategoryId(categoryId));
    }

    // Admin: Create new category
    @PostMapping("/admin/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    // Admin: Add new service
    @PostMapping("/admin/services")
    public ResponseEntity<Service> addService(@RequestBody Service service) {
        if (service.getCategory() != null && service.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(service.getCategory().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            service.setCategory(cat);
        }
        return ResponseEntity.ok(serviceRepository.save(service));
    }

    // Admin: Update service
    @PutMapping("/admin/services/{id}")
    public ResponseEntity<Service> updateService(@PathVariable Long id, @RequestBody Service updatedService) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service not found"));
        
        service.setName(updatedService.getName());
        service.setPrice(updatedService.getPrice());
        service.setDurationMinutes(updatedService.getDurationMinutes());
        
        if (updatedService.getCategory() != null && updatedService.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(updatedService.getCategory().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            service.setCategory(cat);
        }
        
        return ResponseEntity.ok(serviceRepository.save(service));
    }

    // Admin: Delete service
    @DeleteMapping("/admin/services/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        if (!serviceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        serviceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
