package com.glowvera.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "services")
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    public Service() {}

    public Service(Long id, Category category, String name, BigDecimal price, Integer durationMinutes) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.price = price;
        this.durationMinutes = durationMinutes;
    }

    public static ServiceBuilder builder() {
        return new ServiceBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Service)) return false;
        Service service = (Service) o;
        return id != null && id.equals(service.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    public static class ServiceBuilder {
        private Long id;
        private Category category;
        private String name;
        private BigDecimal price;
        private Integer durationMinutes;

        public ServiceBuilder id(Long id) { this.id = id; return this; }
        public ServiceBuilder category(Category category) { this.category = category; return this; }
        public ServiceBuilder name(String name) { this.name = name; return this; }
        public ServiceBuilder price(BigDecimal price) { this.price = price; return this; }
        public ServiceBuilder durationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public Service build() {
            return new Service(id, category, name, price, durationMinutes);
        }
    }
}
